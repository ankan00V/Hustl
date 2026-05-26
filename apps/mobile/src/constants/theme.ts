// ─── HUSTL Design System v2 ─────────────────────────────────────
// Dark + Lime + Purple. Premium. Gen Z. Physical.

export const colors = {
  // ── Backgrounds (purple-tinted dark) ──
  bg: "#050508",
  surface: "#0C0B12",
  card: "#12111A",
  elevated: "#1A1924",
  raised: "#23222E",

  // ── Primary Accent (Lime Green) ──
  lime: "#D4FF14",
  limeLight: "#E5FF5C",
  limeDark: "#AACC00",
  limeGlow: "rgba(212, 255, 20, 0.15)",
  limeGlowStrong: "rgba(212, 255, 20, 0.30)",

  // ── Amber Accent ──
  amber: "#D4FF14",
  amberGlow: "rgba(212, 255, 20, 0.15)",
  borderAmber: "rgba(212, 255, 20, 0.30)",

  // ── Secondary Accent (Purple) ──
  purple: "#9D4EDD",
  purpleGlow: "rgba(157, 78, 221, 0.15)",
  purpleDark: "#7B2CBF",

  // ── Feedback ──
  green: "#22C55E",
  greenGlow: "rgba(34, 197, 94, 0.20)",
  red: "#EF4444",
  redGlow: "rgba(239, 68, 68, 0.20)",

  // ── Text ──
  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  textMuted: "#52525B",
  textLime: "#D4FF14",

  // ── Borders / Glass ──
  border: "rgba(255, 255, 255, 0.06)",
  borderLight: "rgba(255, 255, 255, 0.10)",
  borderLime: "rgba(212, 255, 20, 0.30)",
  borderPurple: "rgba(157, 78, 221, 0.25)",
  glass: "rgba(255, 255, 255, 0.04)",
  glassMedium: "rgba(255, 255, 255, 0.07)",
  glassStrong: "rgba(255, 255, 255, 0.12)",

  // ── Tab bar ──
  tabBar: "#0A0914",
  tabBarBorder: "rgba(255, 255, 255, 0.05)",
  tabInactive: "#52525B",
  tabActive: "#D4FF14",

  // ── Legacy compat ──
  ink: "#FAFAFA",
  text: "#A1A1AA",
  muted: "#52525B",
  line: "rgba(255, 255, 255, 0.06)",
  wash: "#0C0B12",
  brand: "#D4FF14",
} as const;

export const gradients = {
  limeCta: ["#D4FF14", "#AACC00"] as const,
  limeSoft: ["rgba(212, 255, 20, 0.15)", "rgba(212, 255, 20, 0.05)"] as const,
  purpleGlow: ["rgba(157, 78, 221, 0.12)", "transparent"] as const,
  heroGradient: ["#1A0B2E", "#050508"] as const,
  cardShine: ["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0)"] as const,
  darkFade: ["#0C0B12", "#050508"] as const,
  greenFlash: ["rgba(34, 197, 94, 0.25)", "transparent"] as const,
  redFlash: ["rgba(239, 68, 68, 0.25)", "transparent"] as const,
  matchCelebration: ["rgba(212, 255, 20, 0.20)", "rgba(157, 78, 221, 0.15)", "transparent"] as const,
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
  sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 999,
} as const;

export const shadows = {
  card: { shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  elevated: { shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 12 },
  glow: { shadowColor: "#D4FF14", shadowOpacity: 0.35, shadowRadius: 20, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  urgentGlow: { shadowColor: "#EF4444", shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  purpleGlow: { shadowColor: "#9D4EDD", shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
} as const;
