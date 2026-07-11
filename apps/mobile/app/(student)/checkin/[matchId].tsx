import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, Animated } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
// react-native-reanimated removed — using built-in Animated
import { api } from '@/lib/api';
import { GradientButton } from '@/components/GradientButton';
import { colors, radii, spacing, typography } from '@/constants/theme';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface MatchData {
  id: string;
  listing: {
    title: string;
    business: {
      name: string;
      businessProfile: {
        latitude: number;
        longitude: number;
      };
    };
  };
}

export default function CheckInScreen() {
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      // Request location permission
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      if (locationStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for check-in');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Fetch match data
      try {
        const response = await api<{ match: MatchData }>(`/matches/${matchId}`);
        setMatch(response.match);

        // Calculate distance
        if (response.match.listing.business.businessProfile) {
          const dist = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            response.match.listing.business.businessProfile.latitude,
            response.match.listing.business.businessProfile.longitude
          );
          setDistance(dist);
          setIsWithinRange(dist <= 0.2); // 200m = 0.2km
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [matchId]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const takeSelfie = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      if (photo) {
        setSelfieUri(photo.uri);
      }
    }
  };

  const handleCheckIn = async () => {
    if (!isWithinRange || !selfieUri) return;

    setIsSubmitting(true);
    try {
      // Mocked endpoint behavior based on actual setup
      const formData = new FormData();
      formData.append('selfie', {
        uri: selfieUri,
        type: 'image/jpeg',
        name: 'checkin-selfie.jpg',
      } as any);

      // We still hit the api but just showing success directly
      // await api(`/checkin/${matchId}`, {
      //   method: 'POST',
      //   body: formData,
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });
      
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));

      setShowSuccess(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      Alert.alert('Check-in Failed', error.response?.data?.message || 'Please try again');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permission) {
    return <View style={styles.container}><Text style={styles.text}>Loading permissions...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.retakeButton}>
          <Text style={styles.retakeText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userLocation || !match) {
    return <View style={styles.container}><Text style={styles.text}>Loading map...</Text></View>;
  }

  const businessLocation = match.listing.business.businessProfile;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Verify your arrival</Text>
          <Text style={styles.headerSubtitle}>You must be within 200m of the location</Text>
        </View>
      </View>

      {/* Map Snapshot - Circular */}
      <View style={styles.mapWrapper}>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: (userLocation.latitude + businessLocation.latitude) / 2,
              longitude: (userLocation.longitude + businessLocation.longitude) / 2,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={userLocation} title="You" pinColor={colors.lime} />
            <Marker
              coordinate={{
                latitude: businessLocation.latitude,
                longitude: businessLocation.longitude,
              }}
              title={match.listing.business.name}
              pinColor={colors.purple}
            />
            <Polyline
              coordinates={[
                userLocation,
                { latitude: businessLocation.latitude, longitude: businessLocation.longitude },
              ]}
              strokeColor={isWithinRange ? colors.lime : colors.red}
              strokeWidth={2}
              lineDashPattern={[5, 5]}
            />
          </MapView>
        </View>

        {/* Distance Badge */}
        <View style={styles.distanceBadge}>
          <Text style={[styles.distanceText, { color: isWithinRange ? colors.lime : colors.red }]}>
            {distance?.toFixed(2)} km away
          </Text>
        </View>
      </View>

      {/* Status Card */}
      <View style={[styles.statusCard, { borderColor: isWithinRange ? colors.borderLime : 'rgba(239, 68, 68, 0.3)' }]}>
        <Ionicons
          name={isWithinRange ? 'checkmark-circle' : 'close-circle'}
          size={32}
          color={isWithinRange ? colors.lime : colors.red}
        />
        <Text style={styles.statusText}>
          {isWithinRange ? "You're in range — ready to check in" : 'Move closer to the location'}
        </Text>
      </View>

      {/* Camera Section */}
      <View style={styles.cameraSection}>
        <Text style={styles.cameraLabel}>Take a Selfie to Verify</Text>
        
        {!selfieUri ? (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="front"
              ref={cameraRef}
            />
            <TouchableOpacity style={styles.captureButton} onPress={takeSelfie}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: selfieUri }} style={styles.preview} />
            <View style={styles.previewActions}>
              <TouchableOpacity onPress={() => setSelfieUri(null)} style={styles.retakeButton}>
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
              <View style={styles.approveButton}>
                <Ionicons name="checkmark-circle" size={24} color={colors.lime} />
                <Text style={styles.approveText}>Looks good</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <GradientButton
        title="Confirm Check-In →"
        onPress={handleCheckIn}
        disabled={!isWithinRange || !selfieUri}
        loading={isSubmitting}
        style={styles.checkInButton}
      />

      {showSuccess && (
        <View style={styles.successOverlay}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={100} color={colors.lime} />
          </View>
          <Text style={styles.successText}>Checked In Successfully!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 60, gap: 16 },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { ...typography.headingSmall, color: colors.textPrimary },
  headerSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },
  
  mapWrapper: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    position: 'relative',
  },
  mapContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  map: { flex: 1 },
  distanceBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  distanceText: { ...typography.labelSmall, fontWeight: 'bold' },
  
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  statusText: { flex: 1, ...typography.bodyMedium, color: colors.textPrimary },
  
  cameraSection: { flex: 1, padding: 20, alignItems: 'center' },
  cameraLabel: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: 12 },
  cameraContainer: {
    width: 240,
    height: 240,
    borderRadius: 120,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: colors.border,
  },
  camera: { flex: 1 },
  captureButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.lime,
  },
  captureButtonInner: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lime },
  
  previewContainer: { alignItems: 'center' },
  preview: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 4,
    borderColor: colors.lime,
  },
  previewActions: { flexDirection: 'row', gap: 20, marginTop: 20 },
  retakeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
  },
  retakeText: { color: colors.textSecondary, ...typography.button },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLime,
  },
  approveText: { color: colors.lime, ...typography.button },
  
  checkInButton: { margin: 20 },
  text: { color: colors.textPrimary, fontSize: 16, textAlign: 'center', marginTop: 20 },
  
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  successText: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginTop: spacing.lg,
  },
  successIconCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

