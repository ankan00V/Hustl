import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radii, shadows, spacing } from "@/constants/theme";

type CardProps = PropsWithChildren<{
  glow?: "lime" | "urgent" | "green" | "none";
  noPadding?: boolean;
  style?: any;
}>;

export function Card({ children, glow = "none", noPadding = false, style }: CardProps) {
  return (
    <View
      style={[
        styles.card,
        glow === "lime" && styles.glowLime,
        glow === "urgent" && styles.glowUrgent,
        glow === "green" && styles.glowGreen,
        noPadding && styles.noPad,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  glowLime: {
    borderColor: colors.borderLime,
    ...shadows.glow,
  },
  glowUrgent: {
    borderColor: "rgba(239, 68, 68, 0.30)",
    ...shadows.urgentGlow,
  },
  glowGreen: {
    borderColor: "rgba(34, 197, 94, 0.25)",
    shadowColor: "#22C55E",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  noPad: {
    padding: 0,
  },
});
