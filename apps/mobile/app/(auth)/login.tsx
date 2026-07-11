import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, Platform, Image, useWindowDimensions, SafeAreaView, TextInput, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { z } from "zod";
import { HustlLogo } from "@/components/HustlLogo";
import { colors, spacing, typography, radii } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";
import { Ionicons } from "@expo/vector-icons";

// Zod validation schema for login
const loginSchema = z.object({
  phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid Indian phone number"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'STUDENT' | 'BUSINESS'>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'phone' | 'password' | null>(null);
  
  const login = useAuthStore((s) => s.login);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const handleLogin = async () => {
    // Validate with Zod
    const validation = loginSchema.safeParse({
      phone,
      password
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      Alert.alert("Validation Error", firstError?.message ?? "Please check your input");
      return;
    }

    setLoading(true);
    try {
      const validData = validation.data;
      const fullPhone = validData.phone.startsWith("+91") ? validData.phone : `+91${validData.phone}`;
      await login(fullPhone, validData.password);
    } catch (err: any) {
      Alert.alert("Login failed", err.message ?? "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const renderFormContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        {!isDesktop && (
          <Pressable style={styles.mobileLogo} onPress={() => router.replace('/')}>
            <HustlLogo size="large" />
          </Pressable>
        )}
        <Text style={styles.welcomeText}>Welcome back</Text>
      </View>

      {/* Role Select Cards */}
      <View style={styles.roleCardsContainer}>
        <Pressable 
          style={[styles.roleCard, role === "STUDENT" && styles.roleCardSelected]}
          onPress={() => setRole("STUDENT")}
        >
          <View style={styles.roleCardHeader}>
            <Ionicons name="school-outline" size={24} color={role === "STUDENT" ? "#C8F33A" : "#A1A1AA"} />
            {role === "STUDENT" && (
              <View style={styles.checkmarkCircle}>
                <Ionicons name="checkmark" size={14} color="#000" />
              </View>
            )}
          </View>
          <Text style={[styles.roleCardTitle, role === "STUDENT" && styles.roleCardTitleSelected]}>Student</Text>
          <Text style={styles.roleCardDesc}>Find shifts</Text>
        </Pressable>
        
        <Pressable 
          style={[styles.roleCard, role === "BUSINESS" && styles.roleCardSelected]}
          onPress={() => setRole("BUSINESS")}
        >
          <View style={styles.roleCardHeader}>
            <Ionicons name="briefcase-outline" size={24} color={role === "BUSINESS" ? "#C8F33A" : "#A1A1AA"} />
            {role === "BUSINESS" && (
              <View style={styles.checkmarkCircle}>
                <Ionicons name="checkmark" size={14} color="#000" />
              </View>
            )}
          </View>
          <Text style={[styles.roleCardTitle, role === "BUSINESS" && styles.roleCardTitleSelected]}>Business</Text>
          <Text style={styles.roleCardDesc}>Fill fast</Text>
        </Pressable>
      </View>

      {/* Input Form */}
      <View style={styles.form}>
        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number</Text>
          <View style={[styles.inputWrapper, focusedInput === 'phone' && styles.inputWrapperFocused]}>
            <Ionicons name="call-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your phone number"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
              onFocus={() => setFocusedInput('phone')}
              onBlur={() => setFocusedInput(null)}
            />
          </View>
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <View style={styles.passwordHeader}>
            <Text style={styles.inputLabel}>Password</Text>
            <Pressable>
              <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
            </Pressable>
          </View>
          <View style={[styles.inputWrapper, focusedInput === 'password' && styles.inputWrapperFocused]}>
            <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your password"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setFocusedInput('password')}
              onBlur={() => setFocusedInput(null)}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="rgba(255, 255, 255, 0.4)" 
              />
            </Pressable>
          </View>
        </View>

        {/* Login Action Button */}
        <Pressable 
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#666', '#444'] : ['#C8F33A', '#9D4EDD']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Logging in..." : "Login →"}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Social Login Buttons */}
        <View style={styles.socialRow}>
          <Pressable style={styles.socialButton}>
            <Ionicons name="logo-google" size={18} color="#fff" />
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
          <Pressable style={styles.socialButton}>
            <Ionicons name="logo-apple" size={18} color="#fff" />
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
        </View>

        {/* Signup Redirect Link */}
        <Link href="/(auth)/signup" asChild>
          <Pressable style={styles.signupButton}>
            <Text style={styles.signupButtonText}>
              New to Hustl? <Text style={styles.signupHighlight}>Sign up</Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );

  if (isDesktop) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safe}>
          {isDesktop && (
            <View style={styles.topLogoContainer}>
              <Pressable style={styles.logoPressable} onPress={() => router.replace('/')}>
                  <HustlLogo size="small" />
                </Pressable>
            </View>
          )}
          <View style={styles.rightContainerDesktop}>
            <ScrollView 
              contentContainerStyle={styles.scrollContainerDesktop} 
              showsVerticalScrollIndicator={false}
              style={styles.desktopCard}
            >
              {renderFormContent()}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Mobile fallback
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainerMobile}>
          <ScrollView 
            contentContainerStyle={styles.scrollContainerMobile} 
            showsVerticalScrollIndicator={false}
            style={styles.mobileCard}
          >
            {renderFormContent()}
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050508",
  },
  safe: {
    flex: 1,
    position: 'relative',
  },
  topLogoContainer: {
    position: "absolute",
    top: 20,
    left: 40,
    zIndex: 10,
  },
  logoPressable: {
    padding: spacing.xs,
  },
  rightContainerDesktop: {
    position: 'absolute',
    left: '49%',
    right: '3%',
    top: '4%',
    bottom: '4%',
    justifyContent: "center",
    alignItems: "stretch",
  },
  desktopCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  centerContainerMobile: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  mobileCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "transparent",
    padding: spacing.lg,
  },
  scrollContainerMobile: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.lg,
  },
  scrollContainerDesktop: {
    flexGrow: 1,
    justifyContent: "center",
    gap: spacing.lg,
    paddingVertical: 40,
    paddingHorizontal: 48,
    width: "100%",
  },
  header: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  mobileLogo: {
    marginBottom: spacing.sm,
  },
  welcomeText: {
    fontSize: typography.displayMedium.fontSize,
    fontWeight: typography.displayMedium.fontWeight,
    letterSpacing: typography.displayMedium.letterSpacing,
    color: '#fff',
    textAlign: "center",
  },
  roleCardsContainer: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  roleCard: {
    flex: 1,
    backgroundColor: "#161616",
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  roleCardSelected: {
    borderColor: "#C8F33A",
    backgroundColor: "rgba(200, 243, 58, 0.05)",
  },
  roleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  checkmarkCircle: {
    width: 20,
    height: 20,
    borderRadius: radii.pill,
    backgroundColor: "#C8F33A",
    justifyContent: "center",
    alignItems: "center",
  },
  roleCardTitle: {
    fontSize: typography.headingSmall.fontSize,
    fontWeight: typography.headingSmall.fontWeight,
    color: "#FAFAFA",
    marginBottom: 4,
  },
  roleCardTitleSelected: {
    color: "#C8F33A",
  },
  roleCardDesc: {
    fontSize: typography.bodySmall.fontSize,
    color: "#A1A1AA",
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FAFAFA",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPasswordLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#C8F33A",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111111",
    borderWidth: 1.5,
    borderColor: "transparent",
    borderRadius: 12,
    paddingHorizontal: spacing.base,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: "#C8F33A",
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  textInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    height: "100%",
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  loginButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
  socialRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#242424",
    borderRadius: 12,
    paddingVertical: 14,
    gap: spacing.xs,
  },
  socialText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  signupButton: {
    alignSelf: "center",
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  signupButtonText: {
    fontSize: 14,
    color: "#A1A1AA",
  },
  signupHighlight: {
    color: "#C8F33A",
    fontWeight: "700",
  },
});

