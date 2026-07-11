import { useState, useEffect, useRef } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View, Image, useWindowDimensions, SafeAreaView, ScrollView, TextInput, Animated } from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
// react-native-reanimated removed — using built-in Animated
import { z } from "zod";
import { Field } from "@/components/Field";
import { HustlLogo } from "@/components/HustlLogo";
import { colors, spacing, shadows } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";
import { Ionicons } from "@expo/vector-icons";

// Zod validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80, "Name too long"),
  phone: z.string().regex(/^(\+91)?[6-9]\d{9}$/, "Invalid Indian phone number"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password too long"),
  role: z.enum(["STUDENT", "BUSINESS"], { required_error: "Please select a role" })
});

type RegisterInput = z.infer<typeof registerSchema>;

type Role = "STUDENT" | "BUSINESS";

export default function RoleSelect() {
  const params = useLocalSearchParams<{ role?: Role }>();
  const [selectedRole, setSelectedRole] = useState<Role | null>(params.role || null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animatedStyle = { transform: [{ scale: scaleAnim }] };

  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  useEffect(() => {
    if (selectedRole) {
      Animated.spring(scaleAnim, { toValue: 1.02, damping: 3, stiffness: 100, useNativeDriver: true }).start();
    }
  }, [selectedRole]);

  const handleRegister = async () => {
    // Validate with Zod
    const validation = registerSchema.safeParse({
      name,
      phone,
      password,
      role: selectedRole
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      Alert.alert("Validation Error", firstError?.message ?? "Please check your input");
      return;
    }

    setLoading(true);
    try {
      const validData = validation.data;
      await register({
        name: validData.name,
        phone: `+91${validData.phone.replace(/^\+91/, "")}`,
        password: validData.password,
        role: validData.role,
      });
      // Auth gate will auto-redirect to the correct dashboard
    } catch (err: any) {
      Alert.alert("Registration failed", err.message ?? "Please try again");
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
        <Text style={styles.title}>Choose your lane</Text>
        <Text style={styles.subtitle}>
          Students find shifts. Businesses fill shifts fast.
        </Text>
      </View>

      {/* Role Selection Cards */}
      <View style={styles.roleCards}>
        <Pressable
          onPress={() => setSelectedRole("STUDENT")}
          style={[
            styles.roleCard,
            selectedRole === "STUDENT" ? styles.roleCardSelected : undefined,
          ]}
        >
          {selectedRole === "STUDENT" && (
            <LinearGradient
              colors={['rgba(212, 255, 20, 0.15)', 'rgba(212, 255, 20, 0.05)']}
              style={styles.cardGradient}
            />
          )}
          <View style={styles.roleHeaderRow}>
            <Ionicons name="school-outline" size={24} color={selectedRole === "STUDENT" ? "#D4FF14" : "rgba(255, 255, 255, 0.4)"} />
            <Text style={styles.roleTitle}>Student</Text>
          </View>
          <Text style={styles.roleDesc}>
            Swipe through nearby work, unlock badges, build your HUSTL score.
          </Text>
          {selectedRole === "STUDENT" && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓ Selected</Text>
            </View>
          )}
        </Pressable>

        <Pressable
          onPress={() => setSelectedRole("BUSINESS")}
          style={[
            styles.roleCard,
            selectedRole === "BUSINESS" ? styles.roleCardSelected : undefined,
          ]}
        >
          {selectedRole === "BUSINESS" && (
            <LinearGradient
              colors={['rgba(157, 78, 221, 0.15)', 'rgba(157, 78, 221, 0.05)']}
              style={styles.cardGradient}
            />
          )}
          <View style={styles.roleHeaderRow}>
            <Ionicons name="briefcase-outline" size={24} color={selectedRole === "BUSINESS" ? "#D4FF14" : "rgba(255, 255, 255, 0.4)"} />
            <Text style={styles.roleTitle}>Business</Text>
          </View>
          <Text style={styles.roleDesc}>
            Post shifts, review students, hire urgent help in real time.
          </Text>
          {selectedRole === "BUSINESS" && (
            <View style={styles.selectedBadge}>
              <Text style={styles.selectedBadgeText}>✓ Selected</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Registration Form */}
      {selectedRole && (
        <Animated.View style={[styles.form, animatedStyle]}>
          <Text style={styles.formTitle}>Create your account</Text>
          
          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={selectedRole === "STUDENT" ? "Ananya Rao" : "Brew Lane Cafe"}
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Phone Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your phone number"
                placeholderTextColor="rgba(255, 255, 255, 0.3)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="rgba(255, 255, 255, 0.4)" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Min 6 characters"
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

          {/* Register Action Button */}
          <Pressable
            style={[styles.registerButton, loading ? styles.registerButtonDisabled : undefined]}
            onPress={handleRegister}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#666', '#444'] : ['#D4FF14', '#8B5CF6']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.registerButtonText}>
                {loading ? "Creating account..." : `Join as ${selectedRole === "STUDENT" ? "Student" : "Business"} →`}
              </Text>
            </LinearGradient>
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.loginLink}>
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkHighlight}>Log in</Text>
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          By continuing, you agree to our{" "}
          <Text style={styles.footerLink}>Terms</Text> and{" "}
          <Text style={styles.footerLink}>Privacy Policy</Text>
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
          <View style={styles.topLogoContainer}>
            <Pressable style={styles.logoPressable} onPress={() => router.replace('/')}>
                <HustlLogo size="small" />
              </Pressable>
          </View>

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
    alignItems: "flex-start",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  mobileLogo: {
    alignSelf: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: '#fff',
    textAlign: "left",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "left",
  },
  roleCards: {
    gap: spacing.md,
  },
  roleCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: spacing.lg,
    gap: spacing.xs,
    position: "relative",
    overflow: "hidden",
  },
  roleCardSelected: {
    borderColor: colors.lime,
    ...shadows.glow,
  },
  cardGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  roleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: '#fff',
  },
  roleDesc: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  selectedBadge: {
    backgroundColor: "rgba(212, 255, 20, 0.15)",
    borderRadius: 99,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(212, 255, 20, 0.3)",
  },
  selectedBadgeText: {
    color: colors.lime,
    fontSize: 10,
    fontWeight: "800",
  },
  form: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: '#fff',
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "rgba(255, 255, 255, 0.8)",
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
  registerButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  loginLink: {
    alignSelf: "center",
    paddingVertical: spacing.xs,
  },
  loginLinkText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.4)",
  },
  loginLinkHighlight: {
    color: "#8B5CF6",
    fontWeight: "700",
  },
  footer: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  footerText: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.3)",
    textAlign: "center",
    lineHeight: 16,
  },
  footerLink: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
});
