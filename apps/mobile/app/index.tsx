import { Link } from "expo-router";
import { Image, Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HustlLogo } from "@/components/HustlLogo";
import { colors, spacing, radii, shadows } from "@/constants/theme";

export default function Landing() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 900;
  const heroWidth = width;
  const heroHeight = height;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0B2E', '#240B3E', '#0F0520']}
        locations={[0, 0.5, 1]}
        style={styles.gradientBg}
      />

      <View style={styles.stage}>
        <View style={[styles.heroFrame, { width: heroWidth, height: heroHeight }]}>
          <Image
            source={require('../assets/images/landing-bg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />

          <SafeAreaView style={styles.safe}>
            <View style={StyleSheet.flatten([styles.topBar, isDesktop ? styles.topBarDesktop : undefined])}>
              <Link href="/" asChild>
                <Pressable style={StyleSheet.flatten([styles.logoSlot, isDesktop ? styles.logoSlotDesktop : undefined])}>
                  <HustlLogo size="small" />
                </Pressable>
              </Link>

              {isDesktop && (
                <View style={styles.navLinks}>
                  <Pressable style={styles.navLink}>
                    <Text style={styles.navLinkText}>For Students</Text>
                  </Pressable>
                  <Pressable style={styles.navLink}>
                    <Text style={styles.navLinkText}>For Businesses</Text>
                  </Pressable>
                  <Pressable style={styles.navLink}>
                    <Text style={styles.navLinkText}>How it Works</Text>
                  </Pressable>
                  <Pressable style={styles.navLink}>
                    <Text style={styles.navLinkText}>Pricing</Text>
                  </Pressable>
                  <Pressable style={styles.navLink}>
                    <Text style={styles.navLinkText}>About</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.topRight}>
                <Pressable style={styles.themeToggle}>
                  <Text style={styles.themeIcon}>☀️</Text>
                </Pressable>
                <Link href="/(auth)/login" asChild>
                  <Pressable style={styles.getAppBtn}>
                    <LinearGradient
                      colors={['#D4FF14', '#AACC00']}
                      style={styles.getAppGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.getAppBtnText}>Get the App</Text>
                    </LinearGradient>
                  </Pressable>
                </Link>
              </View>
            </View>

            <View style={StyleSheet.flatten([styles.ctaContainer, isDesktop ? styles.ctaContainerDesktop : undefined])}>
              <Link href={{ pathname: "/(auth)/role-select", params: { role: "STUDENT" } }} asChild>
                <Pressable style={styles.primaryBtn}>
                  <LinearGradient
                    colors={['#D4FF14', '#AACC00']}
                    style={StyleSheet.flatten([styles.btnGradient, isDesktop ? styles.btnGradientDesktop : undefined])}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={StyleSheet.flatten([styles.primaryBtnText, isDesktop ? styles.heroBtnTextDesktop : undefined])}>I'm a Student</Text>
                  </LinearGradient>
                </Pressable>
              </Link>
              <Link href={{ pathname: "/(auth)/role-select", params: { role: "BUSINESS" } }} asChild>
                <Pressable style={isDesktop ? styles.secondaryBtnDesktop : styles.secondaryBtn}>
                  <Text style={StyleSheet.flatten([styles.secondaryBtnText, isDesktop ? styles.heroBtnTextDesktop : undefined])}>I'm a Business</Text>
                </Pressable>
              </Link>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#050508',
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#030306',
  },
  heroFrame: {
    position: 'relative',
    overflow: 'hidden',
    maxWidth: '100%',
    maxHeight: '100%',
  },
  safe: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
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
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  topBarDesktop: {
    paddingLeft: 88,
    paddingRight: 84,
    paddingTop: 4,
    paddingBottom: 4,
    paddingVertical: 4,
  },
  logoSlot: {
    width: 136,
    height: 80,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  logoSlotDesktop: {
    height: 60,
    justifyContent: "center",
  },
  navLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xl,
    flex: 1,
    justifyContent: "center",
  },
  navLink: {
    paddingVertical: spacing.sm,
  },
  navLinkText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "600",
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  themeToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  themeIcon: {
    fontSize: 18,
  },
  getAppBtn: {
    borderRadius: radii.pill,
    overflow: "hidden",
    ...shadows.glow,
  },
  getAppGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  getAppBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "800",
  },
  ctaContainer: {
    position: 'absolute',
    bottom: '24%',
    left: '3.75%',
    flexDirection: 'row',
    gap: spacing.md,
  },
  ctaContainerDesktop: {
    left: 56,
    bottom: '16%',
  },
  primaryBtn: {
    borderRadius: radii.pill,
    overflow: "hidden",
    ...shadows.glow,
  },
  btnGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    alignItems: "center",
    justifyContent: "center",
  },
  btnGradientDesktop: {
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  primaryBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "800",
  },
  heroBtnTextDesktop: {
    fontSize: 15,
    fontWeight: "800",
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryBtnDesktop: {
    backgroundColor: '#0A0914',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: '#8B5CF6',
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
});

// Made with Bob
