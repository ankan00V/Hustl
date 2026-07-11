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
import * as ImagePicker from "expo-image-picker";
import { z } from "zod";
import { colors, spacing, radii } from "@/constants/theme";
import { profileApi } from "@/lib/api";
import { useAuthStore } from "@/stores/auth";

const SKILL_OPTIONS = [
  "Barista",
  "Waiter",
  "Cashier",
  "Sales",
  "Event Staff",
  "Delivery",
  "Data Entry",
  "Content Writing",
  "Social Media",
  "Photography",
  "Videography",
  "Graphic Design",
  "Teaching",
  "Tutoring",
];

const AVAILABILITY_SLOTS = [
  { label: "Weekday Mornings", value: "weekday_morning" },
  { label: "Weekday Afternoons", value: "weekday_afternoon" },
  { label: "Weekday Evenings", value: "weekday_evening" },
  { label: "Weekend Mornings", value: "weekend_morning" },
  { label: "Weekend Afternoons", value: "weekend_afternoon" },
  { label: "Weekend Evenings", value: "weekend_evening" },
];

type Step = "college" | "skills" | "bio" | "avatar" | "availability";

export default function StudentOnboardingScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>("college");
  const [collegeName, setCollegeName] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const progress = {
    college: 20,
    skills: 40,
    bio: 60,
    avatar: 80,
    availability: 100,
  }[step];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else if (selectedSkills.length < 5) {
      setSelectedSkills([...selectedSkills, skill]);
    } else {
      Alert.alert("Maximum Skills", "You can select up to 5 skills");
    }
  };

  const toggleAvailability = (slot: string) => {
    if (availability.includes(slot)) {
      setAvailability(availability.filter((s) => s !== slot));
    } else {
      setAvailability([...availability, slot]);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets?.[0]?.uri;
      if (uri) {
        setAvatarUri(uri);
      }
    }
  };

  const handleNext = () => {
    if (step === "college") {
      if (!collegeName.trim()) {
        Alert.alert("College Required", "Please enter your college name");
        return;
      }
      setStep("skills");
    } else if (step === "skills") {
      if (selectedSkills.length === 0) {
        Alert.alert("Skills Required", "Please select at least one skill");
        return;
      }
      setStep("bio");
    } else if (step === "bio") {
      if (!bio.trim() || bio.trim().length < 20) {
        Alert.alert("Bio Required", "Please write at least 20 characters about yourself");
        return;
      }
      setStep("avatar");
    } else if (step === "avatar") {
      setStep("availability");
    } else if (step === "availability") {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (availability.length === 0) {
      Alert.alert("Availability Required", "Please select at least one availability slot");
      return;
    }

    setLoading(true);
    try {
      // Update student profile
      await profileApi.updateStudent({
        collegeName: collegeName.trim(),
        skills: selectedSkills,
        bio: bio.trim(),
        availabilitySlots: availability,
        avatarUrl: avatarUri || undefined,
      });

      // Navigate to deck
      router.replace("/(student)/deck");
    } catch (error: any) {
      console.error("Onboarding error:", error);
      
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

  const handleSkip = () => {
    if (step === "avatar") {
      setStep("availability");
    } else if (step === "availability") {
      router.replace("/(student)/deck");
    }
  };

  const renderStep = () => {
    if (step === "college") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Which college do you attend?</Text>
            <Text style={styles.subtitle}>This helps us verify your student status</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>College Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="school-outline"
                  size={20}
                  color="rgba(255, 255, 255, 0.4)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., IIT Bombay, BITS Pilani"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={collegeName}
                  onChangeText={setCollegeName}
                  autoFocus
                />
              </View>
            </View>
          </View>
        </>
      );
    }

    if (step === "skills") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>What are your skills?</Text>
            <Text style={styles.subtitle}>Select up to 5 skills (you can add more later)</Text>
          </View>

          <View style={styles.skillsGrid}>
            {SKILL_OPTIONS.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <Pressable
                  key={skill}
                  style={[styles.skillChip, isSelected && styles.skillChipSelected]}
                  onPress={() => toggleSkill(skill)}
                >
                  <Text style={[styles.skillText, isSelected && styles.skillTextSelected]}>
                    {skill}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.lime} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.selectedCount}>
            {selectedSkills.length}/5 skills selected
          </Text>
        </>
      );
    }

    if (step === "bio") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Tell us about yourself</Text>
            <Text style={styles.subtitle}>Write a short bio to stand out to employers</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio (min 20 characters)</Text>
              <TextInput
                style={styles.bioInput}
                placeholder="I'm a 2nd year CS student passionate about tech and design. I have experience in..."
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={6}
                maxLength={500}
                autoFocus
              />
              <Text style={styles.charCount}>{bio.length}/500</Text>
            </View>
          </View>
        </>
      );
    }

    if (step === "avatar") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Add a profile photo</Text>
            <Text style={styles.subtitle}>A photo helps employers recognize you</Text>
          </View>

          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <View style={styles.avatarPreview}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name?.slice(0, 2).toUpperCase() || "ME"}
                  </Text>
                </View>
                <Pressable style={styles.changePhotoButton} onPress={pickImage}>
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable style={styles.uploadButton} onPress={pickImage}>
                <Ionicons name="camera-outline" size={32} color={colors.lime} />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </Pressable>
            )}
          </View>

          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </>
      );
    }

    if (step === "availability") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>When are you available?</Text>
            <Text style={styles.subtitle}>Select your preferred work times</Text>
          </View>

          <View style={styles.availabilityGrid}>
            {AVAILABILITY_SLOTS.map((slot) => {
              const isSelected = availability.includes(slot.value);
              return (
                <Pressable
                  key={slot.value}
                  style={[styles.availabilityChip, isSelected && styles.availabilityChipSelected]}
                  onPress={() => toggleAvailability(slot.value)}
                >
                  <Text
                    style={[
                      styles.availabilityText,
                      isSelected && styles.availabilityTextSelected,
                    ]}
                  >
                    {slot.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.lime} />
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </>
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

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}% Complete</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {step !== "college" && (
          <Pressable
            style={styles.backButton}
            onPress={() => {
              const steps: Step[] = ["college", "skills", "bio", "avatar", "availability"];
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
                {step === "availability" ? "Complete" : "Next"} →
              </Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>
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
  textInput: { flex: 1, color: "#fff", fontSize: 15, fontWeight: "500", height: "100%" },
  bioInput: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    padding: spacing.base,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    minHeight: 120,
    textAlignVertical: "top",
  },
  charCount: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "right",
    marginTop: spacing.xs,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  skillChipSelected: {
    backgroundColor: "rgba(212, 255, 20, 0.1)",
    borderColor: colors.lime,
  },
  skillText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
  skillTextSelected: { color: colors.lime, fontWeight: "700" },
  selectedCount: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    marginTop: spacing.md,
  },
  avatarContainer: { alignItems: "center", marginVertical: spacing.xl },
  avatarPreview: { alignItems: "center", gap: spacing.md },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.lime,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "900" },
  changePhotoButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.lime,
  },
  changePhotoText: { color: colors.lime, fontSize: 14, fontWeight: "700" },
  uploadButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(212, 255, 20, 0.1)",
    borderWidth: 2,
    borderColor: colors.lime,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  uploadText: { color: colors.lime, fontSize: 13, fontWeight: "700" },
  availabilityGrid: { gap: spacing.sm },
  availabilityChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  availabilityChipSelected: {
    backgroundColor: "rgba(212, 255, 20, 0.1)",
    borderColor: colors.lime,
  },
  availabilityText: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },
  availabilityTextSelected: { color: colors.lime, fontWeight: "700" },
  skipButton: { alignSelf: "center", marginTop: spacing.lg, padding: spacing.sm },
  skipText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
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
