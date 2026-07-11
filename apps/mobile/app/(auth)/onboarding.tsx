import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
// react-native-reanimated removed — using built-in Animated (works in Expo Go without native build)
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";
import { HustlLogo } from "@/components/HustlLogo";
import { colors, spacing, radii } from "@/constants/theme";
import { sendOTP, verifyOTP } from "@/lib/otp-api";
import { useAuthStore } from "@/stores/auth";
import * as SecureStore from "expo-secure-store";

// Validation schemas
const phoneSchema = z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number");
const otpSchema = z.string().length(6, "OTP must be 6 digits");

type Step = "phone" | "otp" | "role" | "name";

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"STUDENT" | "BUSINESS" | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpInputs = useRef<(TextInput | null)[]>([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatedStyle = { transform: [{ scale: scaleAnim }] };

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === "otp" && otpInputs.current[0]) {
      setTimeout(() => otpInputs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleSendOTP = async () => {
    const validation = phoneSchema.safeParse(phone);
    if (!validation.success) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      await sendOTP(`+91${phone}`);
      setStep("otp");
      setResendTimer(60);
      Animated.spring(scaleAnim, { toValue: 1.02, damping: 3, stiffness: 100, useNativeDriver: true }).start();
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const validation = otpSchema.safeParse(otp);
    if (!validation.success) {
      Alert.alert("Invalid OTP", "Please enter a valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      // Check if user exists by attempting verification without name/role
      const result = await verifyOTP(`+91${phone}`, otp);
      
      // Store tokens
      await SecureStore.setItemAsync("hustl_jwt", result.token);
      await SecureStore.setItemAsync("hustl_refresh", result.refreshToken);
      await SecureStore.setItemAsync("hustl_user", JSON.stringify(result.user));

      // Update auth store
      useAuthStore.setState({
        user: result.user,
        token: result.token,
      });

      // Navigate based on role
      if (result.user.role === "STUDENT") {
        router.replace("/(student)/deck");
      } else {
        router.replace("/(business)/dashboard");
      }
    } catch (error: any) {
      // If user doesn't exist, ask for role and name
      if (error.code === "USER_NOT_FOUND" || error.statusCode === 404) {
        setStep("role");
      } else {
        Alert.alert("Error", error.message ?? "Invalid OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!role) {
      Alert.alert("Select Role", "Please select whether you're a student or business");
      return;
    }

    if (!name || name.trim().length < 2) {
      Alert.alert("Enter Name", "Please enter your name");
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(`+91${phone}`, otp, name.trim(), role);

      // Store tokens
      await SecureStore.setItemAsync("hustl_jwt", result.token);
      await SecureStore.setItemAsync("hustl_refresh", result.refreshToken);
      await SecureStore.setItemAsync("hustl_user", JSON.stringify(result.user));

      // Update auth store
      useAuthStore.setState({
        user: result.user,
        token: result.token,
      });

      // Navigate to onboarding flow
      if (role === "STUDENT") {
        router.replace("/(auth)/student-onboarding");
      } else {
        router.replace("/(auth)/business-onboarding");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange = (value: string, index: number) => {
    const newOtp = otp.split("");
    newOtp[index] = value;
    setOtp(newOtp.join(""));

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.join("").length === 6) {
      handleVerifyOTP();
    }
  };

  const handleOTPKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const renderContent = () => {
    if (step === "phone") {
      return (
        <>
          <View style={styles.header}>
            {!isDesktop && (
              <Pressable style={styles.mobileLogo} onPress={() => router.replace("/")}>
                <HustlLogo size="large" />
              </Pressable>
            )}
            <Text style={styles.title}>Welcome to Hustl</Text>
            <Text style={styles.subtitle}>Enter your phone number to get started</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.phoneInputWrapper}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="9876543210"
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleSendOTP}
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
                  <Text style={styles.buttonText}>Send OTP →</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </>
      );
    }

    if (step === "otp") {
      return (
        <Animated.View style={animatedStyle}>
          <View style={styles.header}>
            <Pressable onPress={() => setStep("phone")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to +91{phone}
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <TextInput
                key={index}
                ref={(ref) => { otpInputs.current[index] = ref; }}
                style={[styles.otpInput, otp[index] && styles.otpInputFilled]}
                value={otp[index] || ""}
                onChangeText={(value) => handleOTPChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleOTPKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <View style={styles.resendRow}>
            {resendTimer > 0 ? (
              <Text style={styles.resendText}>Resend OTP in {resendTimer}s</Text>
            ) : (
              <Pressable onPress={handleSendOTP}>
                <Text style={styles.resendLink}>Resend OTP</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading || otp.length < 6}
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
                <Text style={styles.buttonText}>Verify →</Text>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>
      );
    }

    if (step === "role") {
      return (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Choose your role</Text>
            <Text style={styles.subtitle}>Are you a student or business?</Text>
          </View>

          <View style={styles.roleCards}>
            <Pressable
              onPress={() => setRole("STUDENT")}
              style={[styles.roleCard, role === "STUDENT" && styles.roleCardSelected]}
            >
              {role === "STUDENT" && (
                <LinearGradient
                  colors={["rgba(212, 255, 20, 0.15)", "rgba(212, 255, 20, 0.05)"]}
                  style={styles.cardGradient}
                />
              )}
              <Ionicons
                name="school-outline"
                size={32}
                color={role === "STUDENT" ? "#D4FF14" : "rgba(255, 255, 255, 0.4)"}
              />
              <Text style={styles.roleTitle}>Student</Text>
              <Text style={styles.roleDesc}>Find flexible work opportunities</Text>
            </Pressable>

            <Pressable
              onPress={() => setRole("BUSINESS")}
              style={[styles.roleCard, role === "BUSINESS" && styles.roleCardSelected]}
            >
              {role === "BUSINESS" && (
                <LinearGradient
                  colors={["rgba(139, 92, 246, 0.15)", "rgba(139, 92, 246, 0.05)"]}
                  style={styles.cardGradient}
                />
              )}
              <Ionicons
                name="briefcase-outline"
                size={32}
                color={role === "BUSINESS" ? "#D4FF14" : "rgba(255, 255, 255, 0.4)"}
              />
              <Text style={styles.roleTitle}>Business</Text>
              <Text style={styles.roleDesc}>Hire students for shifts</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="rgba(255, 255, 255, 0.4)"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder={role === "STUDENT" ? "Ananya Rao" : "Brew Lane Cafe"}
                  placeholderTextColor="rgba(255, 255, 255, 0.3)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleCompleteRegistration}
              disabled={loading || !role || !name}
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
                  <Text style={styles.buttonText}>Continue →</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </>
      );
    }

    return null;
  };

  if (isDesktop) {
    return (
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/login-bg.png")}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        <SafeAreaView style={styles.safe}>
          <View style={styles.topLogoContainer}>
            <Pressable onPress={() => router.replace("/")}>
              <HustlLogo size="small" />
            </Pressable>
          </View>
          <View style={styles.rightContainerDesktop}>
            <ScrollView
              contentContainerStyle={styles.scrollContainerDesktop}
              showsVerticalScrollIndicator={false}
              style={styles.desktopCard}
            >
              {renderContent()}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/login-bg.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainerMobile}>
          <ScrollView
            contentContainerStyle={styles.scrollContainerMobile}
            showsVerticalScrollIndicator={false}
            style={styles.mobileCard}
          >
            {renderContent()}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050508" },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  safe: { flex: 1, position: "relative" },
  topLogoContainer: { position: "absolute", top: 20, left: 40, zIndex: 10 },
  rightContainerDesktop: {
    position: "absolute",
    left: "49%",
    right: "3%",
    top: "4%",
    bottom: "4%",
    justifyContent: "center",
    alignItems: "stretch",
  },
  desktopCard: { backgroundColor: "transparent", borderWidth: 0, width: "100%", alignSelf: "stretch" },
  centerContainerMobile: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.md },
  mobileCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(10, 5, 22, 0.85)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(139, 92, 246, 0.25)",
    padding: spacing.lg,
  },
  scrollContainerMobile: { flexGrow: 1, justifyContent: "center", gap: spacing.lg },
  scrollContainerDesktop: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.lg,
    paddingVertical: 40,
    paddingHorizontal: 48,
    width: "100%",
  },
  header: { alignItems: "center", gap: spacing.xs, marginBottom: spacing.md },
  mobileLogo: { marginBottom: spacing.sm },
  backButton: { alignSelf: "flex-start", marginBottom: spacing.sm, padding: spacing.xs },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", textAlign: "center" },
  subtitle: { fontSize: 14, color: "rgba(255, 255, 255, 0.5)", textAlign: "center" },
  form: { gap: spacing.md },
  inputGroup: { gap: spacing.xs },
  inputLabel: { fontSize: 14, fontWeight: "500", color: "rgba(255, 255, 255, 0.8)" },
  phoneInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    overflow: "hidden",
  },
  countryCode: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: "rgba(255, 255, 255, 0.06)",
  },
  countryCodeText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  phoneInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
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
  otpContainer: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm, marginVertical: spacing.lg },
  otpInput: {
    flex: 1,
    height: 56,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  otpInputFilled: { borderColor: colors.lime, backgroundColor: "rgba(212, 255, 20, 0.05)" },
  resendRow: { alignItems: "center", marginBottom: spacing.md },
  resendText: { color: "rgba(255, 255, 255, 0.4)", fontSize: 13 },
  resendLink: { color: "#8B5CF6", fontSize: 13, fontWeight: "700" },
  roleCards: { gap: spacing.md, marginBottom: spacing.md },
  roleCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: spacing.lg,
    gap: spacing.xs,
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
  },
  roleCardSelected: { borderColor: colors.lime },
  cardGradient: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  roleTitle: { fontSize: 18, fontWeight: "800", color: "#fff", marginTop: spacing.xs },
  roleDesc: { fontSize: 13, color: "rgba(255, 255, 255, 0.5)", textAlign: "center" },
  primaryButton: { borderRadius: 12, overflow: "hidden", marginTop: spacing.sm },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { paddingVertical: 14, alignItems: "center", justifyContent: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
