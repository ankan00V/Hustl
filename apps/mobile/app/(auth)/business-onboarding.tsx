import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { colors, spacing, radii } from "@/constants/theme";
import { profileApi } from "@/lib/api";

const BUSINESS_CATEGORIES = [
  "Food & Beverage",
  "Retail",
  "Events",
  "Hospitality",
  "Delivery",
  "Office & Admin",
  "Marketing",
  "Tech",
  "Other",
];

type Step = "name" | "category" | "location" | "complete";

export default function BusinessOnboardingScreen() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("name");
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const progress = {
    name: 33,
    category: 66,
    location: 100,
    complete: 100,
  }[step];

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant location permissions");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLat(location.coords.latitude);
      setLng(location.coords.longitude);

      // Reverse geocode to get address
      const [result] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (result) {
        const addressParts = [
          result.name,
          result.street,
          result.city,
          result.region,
          result.postalCode,
        ].filter(Boolean);
        setAddress(addressParts.join(", "));
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to get location");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === "name") {
      if (!businessName.trim()) {
        Alert.alert("Business Name Required", "Please enter your business name");
        return;
      }
      setStep("category");
    } else if (step === "category") {
      if (!category) {
        Alert.alert("Category Required", "Please select a business category");
        return;
      }
      setStep("location");
    } else if (step === "location") {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!address.trim() || !lat || !lng) {
      Alert.alert("Location Required", "Please set your business location");
      return;
    }

    setLoading(true);
    try {
      await profileApi.updateBusiness({
        businessName: businessName.trim(),
        category,
        address: address.trim(),
        lat,
        lng,
      });

      setStep("complete");
      setTimeout(() => {
        router.replace("/(business)/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Business onboarding error:", error);
      
      // Handle different error types
      if (error.statusCode === 401) {
        Alert.alert(
          "Session Expired",
          "Please log in again to continue",
          [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
        );
      } else if (error.statusCode >= 500) {
        Alert.alert(
          "Server Error",
          "We're experiencing technical difficulties. Please try again in a few moments.",
          [{ text: "Retry", onPress: handleComplete }, { text: "Cancel", style: "cancel" }]
        );
      } else if (error.statusCode === 400) {
        Alert.alert("Validation Error", error.message ?? "Please check your information and try again");
      } else if (!error.statusCode) {
        Alert.alert(
          "Network Error",
          "Please check your internet connection and try again",
          [{ text: "Retry", onPress: handleComplete }, { text: "Cancel", style: "cancel" }]
        );
      } else {
        Alert.alert("Error", error.message ?? "Failed to complete onboarding");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    if (step === "name") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>What's your business name?</Text>
            <Text style={styles.subtitle}>This will be visible to students</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color="rgba(255, 255, 255, 0.4)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Brew Lane Cafe"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={businessName}
                  onChangeText={setBusinessName}
                  autoFocus
                />
              </View>
            </View>
          </View>
        </>
      );
    }

    if (step === "category") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Select your category</Text>
            <Text style={styles.subtitle}>Choose the category that best fits your business</Text>
          </View>

          <View style={styles.categoryGrid}>
            {BUSINESS_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <Pressable
                  key={cat}
                  style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                  onPress={() => setCategory(cat)}
                >
                  {isSelected && (
                    <LinearGradient
                      colors={["rgba(212, 255, 20, 0.15)", "rgba(212, 255, 20, 0.05)"]}
                      style={styles.cardGradient}
                    />
                  )}
                  <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                    {cat}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.lime} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </>
      );
    }

    if (step === "location") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Where is your business?</Text>
            <Text style={styles.subtitle}>Students will see shifts near this location</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Business Address</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color="rgba(255, 255, 255, 0.4)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your business address"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={address}
                  onChangeText={setAddress}
                  multiline
                />
              </View>
            </View>

            <Pressable
              style={[styles.locationButton, loading && styles.buttonDisabled]}
              onPress={getCurrentLocation}
              disabled={loading}
            >
              <Ionicons name="navigate" size={20} color={colors.lime} />
              <Text style={styles.locationButtonText}>
                {loading ? "Getting location..." : "Use Current Location"}
              </Text>
            </Pressable>

            {lat && lng && (
              <View style={styles.coordsDisplay}>
                <Text style={styles.coordsText}>
                  📍 {lat.toFixed(6)}, {lng.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
        </>
      );
    }

    if (step === "complete") {
      return (
        <View style={styles.completeContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={colors.lime} />
          </View>
          <Text style={styles.completeTitle}>All set! 🎉</Text>
          <Text style={styles.completeSubtitle}>
            Your business profile is ready. Start posting shifts now!
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1A0B2E", "#240B3E", "#0F0520"]}
        locations={[0, 0.5, 1]}
        style={styles.gradientBg}
      />

      {step !== "complete" && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}% Complete</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      {step !== "complete" && (
        <View style={styles.actions}>
          {step !== "name" && (
            <Pressable
              style={styles.backButton}
              onPress={() => {
                const steps: Step[] = ["name", "category", "location"];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  const prevStep = steps[currentIndex - 1];
                  if (prevStep) {
                    setStep(prevStep);
                  }
                }
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          )}

          <Pressable
            style={[styles.nextButton, loading && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ["#666", "#444"] : ["#D4FF14", "#8B5CF6"]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.nextText}>
                  {step === "location" ? "Complete" : "Next"} →
                </Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  gradientBg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  progressContainer: { padding: spacing.lg, paddingBottom: spacing.md },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.lime },
  progressText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
    marginTop: spacing.xs,
    textAlign: "center",
  },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  header: { alignItems: "center", gap: spacing.xs, marginBottom: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 14, color: "rgba(255, 255, 255, 0.5)", textAlign: "center" },
  form: { gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "rgba(255, 255, 255, 0.8)" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingHorizontal: spacing.base,
    minHeight: 52,
  },
  inputIcon: { marginRight: spacing.sm },
  textInput: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "500", paddingVertical: spacing.md },
  categoryGrid: { gap: spacing.sm },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  categoryCardSelected: {
    borderColor: colors.lime,
  },
  cardGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  categoryText: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },
  categoryTextSelected: { color: colors.lime, fontWeight: "700" },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(212, 255, 20, 0.1)",
    borderWidth: 1.5,
    borderColor: colors.lime,
    borderRadius: 14,
    paddingVertical: spacing.md,
  },
  locationButtonText: { color: colors.lime, fontSize: 15, fontWeight: "700" },
  coordsDisplay: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    padding: spacing.md,
    alignItems: "center",
  },
  coordsText: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  completeContainer: { alignItems: "center", gap: spacing.lg, paddingTop: 60 },
  successIcon: { marginBottom: spacing.md },
  completeTitle: { fontSize: 32, fontWeight: "800", color: "#fff", textAlign: "center" },
  completeSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 24,
  },
  actions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  backText: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
  nextButton: { flex: 1, borderRadius: 12, overflow: "hidden" },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  nextText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
