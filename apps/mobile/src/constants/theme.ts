// ─── HUSTL Design System v3 ─────────────────────────────────────
// Dark + Lime + Purple. Zero shadows, borders only.

export const colors = {
  // ── Backgrounds ──
  bg: "#0A0A0A",
  surface: "#0A0A0A", // fallback to bg
  card: "#161616",
  elevated: "#1E1E1E",
  raised: "#2A2A2A",

  // ── Primary Accent (Lime Green) ──
  lime: "#C8F33A",
  limeLight: "#E5FF5C", // for legacy
  limeDark: "#AACC00", // for legacy
  limeGlow: "rgba(200, 243, 58, 0.15)",
  limeGlowStrong: "rgba(200, 243, 58, 0.30)",

  // ── Amber Accent ──
  amber: "#F59E0B",
  amberGlow: "rgba(245, 158, 11, 0.15)",

  // ── Secondary Accent (Purple) ──
  purple: "#9D4EDD",
  purpleGlow: "rgba(157, 78, 221, 0.15)",
  purpleDark: "#7B2CBF", // for legacy

  // ── Feedback ──
  green: "#C8F33A", // Use lime for positive feedback
  red: "#EF4444",

  // ── Text ──
  textPrimary: "#FFFFFF",
  textSecondary: "#888888",
  textMuted: "#444444",
  textLime: "#C8F33A",

  // ── Borders ──
  border: "#242424",
  borderLight: "#2A2A2A",
  borderActive: "#C8F33A",
  borderLime: "rgba(200, 243, 58, 0.30)",
  glass: "rgba(255, 255, 255, 0.04)", // Use sparingly, borders preferred

  // ── Tab bar ──
  tabBar: "#0A0A0A",
  tabBarBorder: "#1A1A1A",
  tabInactive: "#888888",
  tabActive: "#C8F33A",

  // ── Icons ──
  iconDefault: "#888888",
  iconActive: "#C8F33A",

  // ── Legacy compat (will be phased out) ──
  ink: "#FFFFFF",
  text: "#888888",
  muted: "#444444",
  line: "#242424",
  wash: "#0A0A0A",
  brand: "#C8F33A",
  greenGlow: "rgba(200, 243, 58, 0.15)",
  redGlow: "rgba(239, 68, 68, 0.15)",
  glassMedium: "rgba(255, 255, 255, 0.08)",
} as const;

export const gradients = {
  limeCta: ["#C8F33A", "#9D4EDD"] as const, // The Gradient CTA from prompt
  limeSoft: ["rgba(200, 243, 58, 0.15)", "rgba(200, 243, 58, 0.05)"] as const,
  purpleGlow: ["rgba(157, 78, 221, 0.12)", "transparent"] as const,
  heroGradient: ["#161616", "#0A0A0A"] as const,
  cardShine: ["rgba(255, 255, 255, 0.04)", "transparent"] as const,
  darkFade: ["#161616", "#0A0A0A"] as const,
  greenFlash: ["rgba(200, 243, 58, 0.25)", "transparent"] as const,
  redFlash: ["rgba(239, 68, 68, 0.25)", "transparent"] as const,
  matchCelebration: ["rgba(200, 243, 58, 0.20)", "rgba(157, 78, 221, 0.15)", "transparent"] as const,
} as const;

export const typography = {
  displayLarge: { fontSize: 48, fontWeight: "900" as const, letterSpacing: -1.5, lineHeight: 52 },
  displayMedium: { fontSize: 36, fontWeight: "900" as const, letterSpacing: -1, lineHeight: 40 },
  headingLarge: { fontSize: 28, fontWeight: "800" as const, letterSpacing: -0.5, lineHeight: 34 },
  headingMedium: { fontSize: 22, fontWeight: "800" as const, letterSpacing: -0.3, lineHeight: 28 },
  headingSmall: { fontSize: 18, fontWeight: "700" as const, letterSpacing: 0, lineHeight: 24 },
  bodyLarge: { fontSize: 17, fontWeight: "400" as const, lineHeight: 25 },
  bodyMedium: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  monoLarge: { fontSize: 24, fontWeight: "700" as const, fontFamily: "monospace" as const, letterSpacing: -0.5 },
  monoMedium: { fontSize: 16, fontWeight: "600" as const, fontFamily: "monospace" as const },
  monoSmall: { fontSize: 13, fontWeight: "600" as const, fontFamily: "monospace" as const },
  monoXL: { fontSize: 32, fontWeight: "800" as const, fontFamily: "monospace" as const, letterSpacing: -1 },
  label: { fontSize: 14, fontWeight: "700" as const, letterSpacing: 0.5, textTransform: "uppercase" as const },
  labelSmall: { fontSize: 11, fontWeight: "800" as const, letterSpacing: 1, textTransform: "uppercase" as const },
  button: { fontSize: 16, fontWeight: "700" as const, letterSpacing: 0.3 },
} as const;

export const spacing = {
  xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32, xxxl: 48,
} as const;

export const radii = {
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999, full: 999,
} as const;

// Shadows are removed as per instruction. Using empty objects to prevent crashes on legacy code.
export const shadows = {
  card: { shadowColor: "transparent", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  elevated: { shadowColor: "transparent", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  glow: { shadowColor: "transparent", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  urgentGlow: { shadowColor: "transparent", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  purpleGlow: { shadowColor: "transparent", shadowOpacity: 0, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
} as const;
