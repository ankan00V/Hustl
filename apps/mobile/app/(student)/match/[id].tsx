import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { colors, spacing, radii, typography } from "@/constants/theme";
import { matchesApi, checkInApi } from "@/lib/api";
import { ChatModal } from "@/components/ChatModal";

interface Match {
  id: string;
  status: string;
  listing: {
    title: string;
    description: string;
    hourlyRate: string;
    totalHours: number;
    startTime: string;
    endTime: string;
    businessName: string;
    businessCategory: string;
    address: string;
  };
  checkInTime: string | null;
  checkOutTime: string | null;
  agreedHours: number | null;
  createdAt: string;
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    loadMatch();
  }, [id]);

  const loadMatch = async () => {
    try {
      const data = await matchesApi.list();
      const foundMatch = data.matches.find((m: any) => m.id === id);
      if (foundMatch) {
        setMatch(foundMatch);
      }
    } catch (error) {
      console.error("Failed to load match:", error);
      Alert.alert("Error", "Failed to load match details");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!match) return;

    try {
      setCheckingIn(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to check in");
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Check for mock location (Android only)
      let isMock = false;
      if (location.mocked !== undefined) {
        isMock = location.mocked;
      }

      if (isMock) {
        Alert.alert(
          "Mock Location Detected",
          "Please disable mock location apps and try again. We need your real location to verify check-in."
        );
        return;
      }

      // Call check-in API
      await checkInApi.arrive(
        match.id,
        location.coords.latitude,
        location.coords.longitude
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Check-In Successful! ✓",
        "You've successfully checked in. Have a great shift!",
        [{ text: "OK", onPress: loadMatch }]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Check-In Failed",
        error.message || "You must be within 500m of the business location to check in."
      );
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    if (!match) return;

    Alert.alert(
      "Check Out",
      "Are you ready to check out? The business will confirm your hours worked.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Check Out",
          style: "default",
          onPress: async () => {
            try {
              setCheckingOut(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

              await checkInApi.checkout(match.id);

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert(
                "Checked Out! ✓",
                "Waiting for business to confirm your hours worked.",
                [{ text: "OK", onPress: loadMatch }]
              );
            } catch (error: any) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", error.message || "Failed to check out");
            } finally {
              setCheckingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleCancel = async () => {
    if (!match) return;

    Alert.alert(
      "Cancel Match",
      "Are you sure you want to cancel this match? This may affect your reputation.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              await matchesApi.cancel(match.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert("Match Cancelled", "The match has been cancelled.", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to cancel match");
            }
          },
        },
      ]
    );
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return { color: colors.amber, label: "Pending", icon: "time-outline" };
      case "ACCEPTED":
        return { color: colors.green, label: "Accepted", icon: "checkmark-circle-outline" };
      case "CHECKED_IN":
        return { color: colors.purple, label: "Checked In", icon: "location" };
      case "COMPLETED":
        return { color: colors.textMuted, label: "Completed", icon: "checkmark-done" };
      case "CANCELLED":
        return { color: colors.red, label: "Cancelled", icon: "close-circle-outline" };
      default:
        return { color: colors.textSecondary, label: status, icon: "help-circle-outline" };
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[styles.gradientBg, { backgroundColor: colors.bg }]}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.lime} />
          <Text style={styles.loadingText}>Loading match...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <View
          style={[styles.gradientBg, { backgroundColor: colors.bg }]}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorTitle}>Match Not Found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(match.status);

  return (
    <SafeAreaView style={styles.container}>
      <View
        style={[styles.gradientBg, { backgroundColor: colors.bg }]}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Match Details</Text>
        <Pressable style={styles.chatBtn} onPress={() => setChatVisible(true)}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
            <Ionicons name={statusInfo.icon as any} size={20} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        {/* Business Info */}
        <View style={styles.card}>
          <View style={styles.businessHeader}>
            <View style={styles.businessLogo}>
              <Text style={styles.logoText}>
                {match.listing.businessName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.businessInfo}>
              <Text style={styles.businessName}>{match.listing.businessName}</Text>
              <Text style={styles.category}>{match.listing.businessCategory}</Text>
            </View>
          </View>

          <Text style={styles.jobTitle}>{match.listing.title}</Text>
          <Text style={styles.description}>{match.listing.description}</Text>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Ionicons name="cash-outline" size={20} color={colors.amber} />
            <Text style={styles.infoLabel}>Pay Rate</Text>
            <Text style={styles.infoValue}>₹{match.listing.hourlyRate}/hr</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Duration</Text>
            <Text style={styles.infoValue}>{match.listing.totalHours} hours</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue}>{formatDate(match.listing.startTime)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="alarm-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Time</Text>
            <Text style={styles.infoValue}>
              {formatTime(match.listing.startTime)} - {formatTime(match.listing.endTime)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={colors.textMuted} />
            <Text style={styles.infoLabel}>Location</Text>
            <Text style={styles.infoValue}>{match.listing.address}</Text>
          </View>
        </View>

        {/* Timeline */}
        {(match.checkInTime || match.checkOutTime) && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Timeline</Text>
            {match.checkInTime && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.green }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Checked In</Text>
                  <Text style={styles.timelineTime}>
                    {new Date(match.checkInTime).toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            )}
            {match.checkOutTime && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: colors.purple }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Checked Out</Text>
                  <Text style={styles.timelineTime}>
                    {new Date(match.checkOutTime).toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {match.status === "ACCEPTED" && (
            <Pressable
              style={styles.primaryButton}
              onPress={handleCheckIn}
              disabled={checkingIn}
            >
              <View
                style={[styles.buttonGradient, { backgroundColor: colors.lime }]}
              >
                {checkingIn ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="location" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Check In</Text>
                  </>
                )}
              </View>
            </Pressable>
          )}

          {match.status === "CHECKED_IN" && (
            <Pressable
              style={styles.primaryButton}
              onPress={handleCheckOut}
              disabled={checkingOut}
            >
              <View
                style={[styles.buttonGradient, { backgroundColor: colors.lime }]}
              >
                {checkingOut ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Check Out</Text>
                  </>
                )}
              </View>
            </Pressable>
          )}

          {(match.status === "PENDING" || match.status === "ACCEPTED") && (
            <Pressable style={styles.secondaryButton} onPress={handleCancel}>
              <Text style={styles.secondaryButtonText}>Cancel Match</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Chat Modal */}
      <ChatModal
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        recipientName={match.listing.businessName}
        jobTitle={match.listing.title}
        recipientInitials={match.listing.businessName.slice(0, 2).toUpperCase()}
        initialMessages={[]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  gradientBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.sm },
  headerTitle: { ...typography.headingMedium, color: colors.textPrimary, flex: 1, textAlign: "center" },
  chatBtn: { padding: spacing.sm },
  content: { padding: spacing.lg, gap: spacing.lg },
  statusCard: { alignItems: "center" },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
  },
  statusText: { ...typography.bodyLarge, fontWeight: "800" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    padding: spacing.base,
    gap: spacing.md,
  },
  businessHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  businessLogo: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.bg, fontSize: 20, fontWeight: "900" },
  businessInfo: { flex: 1, gap: 4 },
  businessName: { ...typography.headingMedium, color: colors.textPrimary },
  category: { ...typography.bodyMedium, color: colors.textMuted },
  jobTitle: { ...typography.headingLarge, color: colors.textPrimary },
  description: { ...typography.bodyMedium, color: colors.textSecondary, lineHeight: 22 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  infoLabel: { ...typography.bodyMedium, color: colors.textMuted, flex: 1 },
  infoValue: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: "600" },
  cardTitle: { ...typography.headingMedium, color: colors.textPrimary, marginBottom: spacing.sm },
  timelineItem: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md, marginBottom: spacing.md },
  timelineDot: { width: 12, height: 12, borderRadius: 0, marginTop: 4 },
  timelineContent: { flex: 1, gap: 4 },
  timelineLabel: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: "600" },
  timelineTime: { ...typography.bodySmall, color: colors.textMuted },
  actions: { gap: spacing.md },
  primaryButton: { borderRadius: radii.md, overflow: "hidden" },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.base,
  },
  buttonText: { ...typography.bodyLarge, color: "#fff", fontWeight: "800" },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: radii.md,
    paddingVertical: spacing.base,
    alignItems: "center",
  },
  secondaryButtonText: { ...typography.bodyLarge, color: colors.red, fontWeight: "700" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { ...typography.bodyMedium, color: colors.textMuted },
  errorContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.md },
  errorEmoji: { fontSize: 64 },
  errorTitle: { ...typography.headingLarge, color: colors.textPrimary },
  backButton: {
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  backButtonText: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: "700" },
});
