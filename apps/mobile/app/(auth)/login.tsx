import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View, Platform, Image, useWindowDimensions, SafeAreaView, TextInput, ScrollView } from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { z } from "zod";
import { HustlLogo } from "@/components/HustlLogo";
import { colors, spacing } from "@/constants/theme";
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
        <Text style={styles.welcomeText}>Welcome back!</Text>
        <Text style={styles.subtitle}>Login to continue your Hustl journey</Text>
      </View>

      {/* Role Select Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable 
          style={[styles.tab, role === "STUDENT" ? styles.tabSelected : undefined]}
          onPress={() => setRole("STUDENT")}
        >
          <Ionicons 
            name="school-outline" 
            size={18} 
            color={role === "STUDENT" ? "#D4FF14" : "rgba(255, 255, 255, 0.4)"} 
          />
          <Text style={[styles.tabText, role === "STUDENT" ? styles.tabTextSelected : undefined]}>I'm a Student</Text>
        </Pressable>
        <Pressable 
          style={[styles.tab, role === "BUSINESS" ? styles.tabSelected : undefined]}
          onPress={() => setRole("BUSINESS")}
        >
          <Ionicons 
            name="briefcase-outline" 
            size={18} 
            color={role === "BUSINESS" ? "#D4FF14" : "rgba(255, 255, 255, 0.4)"} 
          />
          <Text style={[styles.tabText, role === "BUSINESS" ? styles.tabTextSelected : undefined]}>I'm an Employer</Text>
        </Pressable>
      </View>

      {/* Input Form */}
      <View style={styles.form}>
        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email or Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your email or phone number"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="email-address"
              autoCapitalize="none"
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
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your password"
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
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
          style={[styles.loginButton, loading ? styles.loginButtonDisabled : undefined]}
          onPress={handleLogin}
          disabled={loading}
        >
          <LinearGradient
            colors={loading ? ['#666', '#444'] : ['#D4FF14', '#8B5CF6']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.loginButtonText}>
              {loading ? "Logging in..." : "Login"}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* OR Continue With Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <View style={styles.socialRow}>
          <Pressable style={styles.socialButton}>
            <Ionicons name="logo-google" size={18} color="#4285F4" />
            <Text style={styles.socialText}>Google</Text>
          </Pressable>
          <Pressable style={styles.socialButton}>
            <Ionicons name="logo-apple" size={18} color="#fff" />
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
          <Pressable style={styles.socialButton}>
            <Ionicons name="logo-instagram" size={18} color="#E1306C" />
            <Text style={styles.socialText}>Instagram</Text>
          </Pressable>
        </View>

        {/* Signup Redirect Link */}
        <Link href="/(auth)/role-select" asChild>
          <Pressable style={styles.signupButton}>
            <Text style={styles.signupButtonText}>
              New to Hustl? <Text style={styles.signupHighlight}>Sign up</Text>
            </Text>
          </Pressable>
        </Link>
      </View>

      {/* Bottom Security Banner */}
      <View style={styles.securityBanner}>
        <Ionicons name="shield-checkmark-outline" size={16} color="rgba(255, 255, 255, 0.4)" style={styles.shieldIcon} />
        <Text style={styles.securityBannerText}>
          Safe  •  Secure  •  Trusted by <Text style={styles.securityBannerHighlight}>50K+</Text> students
        </Text>
      </View>
    </>
  );

  if (isDesktop) {
    return (
      <View style={styles.container}>
        {/* Background Image */}
        <Image
          source={require('../../assets/images/login-bg.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />

        <SafeAreaView style={styles.safe}>
          {/* Clickable Logo at Top Left on Desktop */}
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
      <Image
        source={require('../../assets/images/login-bg.png')}
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
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
  // Desktop Container aligned with right vacant purple box
  rightContainerDesktop: {
    position: 'absolute',
    left: '49%',
    right: '3%',
    top: '4%',
    bottom: '4%',
    justifyContent: "center",
    alignItems: "stretch", // Stretches children to fill width
  },
  desktopCard: {
    backgroundColor: "transparent",
    borderWidth: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  // Mobile Fallback container
  centerContainerMobile: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  mobileCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "rgba(10, 5, 22, 0.85)",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(139, 92, 246, 0.25)",
    padding: spacing.lg,
    ...Platform.select({
      web: {
        backdropFilter: "blur(20px)",
      } as any,
    }),
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
    paddingHorizontal: 48, // Internal padding prevents clipping edge cuts
    width: "100%",
  },
  header: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  mobileLogo: {
    marginBottom: spacing.sm,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: "800",
    color: '#fff',
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 14,
    padding: 4,
    marginVertical: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  tabSelected: {
    backgroundColor: "rgba(139, 92, 246, 0.08)",
    borderColor: "rgba(139, 92, 246, 0.3)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.4)",
  },
  tabTextSelected: {
    color: colors.lime,
    fontWeight: "700",
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPasswordLink: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B5CF6",
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
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  dividerText: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 12,
    fontWeight: "500",
  },
  socialRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    paddingVertical: 12,
    gap: spacing.xs,
  },
  socialText: {
    fontSize: 13,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.8)",
  },
  signupButton: {
    alignSelf: "center",
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  signupButtonText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
  },
  signupHighlight: {
    color: "#8B5CF6",
    fontWeight: "700",
  },
  securityBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  shieldIcon: {
    opacity: 0.6,
  },
  securityBannerText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    fontWeight: "600",
  },
  securityBannerHighlight: {
    color: colors.lime,
  },
});
