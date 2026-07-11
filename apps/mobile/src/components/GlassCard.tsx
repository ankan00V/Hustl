import { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radii, spacing } from "@/constants/theme";

interface GlassCardProps {
  intensity?: number;
  tint?: "light" | "dark" | "default";
  borderGlow?: "lime" | "purple" | "amber" | "none";
  noPadding?: boolean;
  style?: ViewStyle;
}

/**
 * GlassCard - Premium glassmorphism card component
 * Creates a frosted glass effect with optional glow borders
 */
export function GlassCard({
  children,
  intensity = 20,
  tint = "dark",
  borderGlow = "none",
  noPadding = false,
  style,
}: PropsWithChildren<GlassCardProps>) {
  const glowColors = {
    lime: colors.lime,
    purple: colors.purple,
    amber: colors.amber,
    none: "transparent",
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.content,
          !noPadding && styles.padding,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

/**
 * GlassButton - Glassmorphism button
 */
interface GlassButtonProps {
  onPress: () => void;
  variant?: "primary" | "secondary";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  style?: ViewStyle;
}

export function GlassButton({
  children,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
}: PropsWithChildren<GlassButtonProps>) {
  const sizeStyles = {
    small: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    medium: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    large: { paddingHorizontal: spacing.xl, paddingVertical: spacing.base },
  };

  return (
    <View style={[styles.buttonContainer, style]}>
      <View
        style={[
          styles.button,
          sizeStyles[size],
          variant === "primary" && styles.buttonPrimary,
          disabled && styles.buttonDisabled,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    overflow: "hidden",
  },
  glowContainer: {
    borderRadius: 0,
  },
  blur: {
    borderRadius: 0,
    overflow: "hidden",
  },
  content: {
    borderRadius: 0,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  padding: {
    padding: spacing.lg,
  },
  buttonContainer: {
    borderRadius: 0,
    overflow: "hidden",
  },
  buttonBlur: {
    borderRadius: 0,
    overflow: "hidden",
  },
  button: {
    borderRadius: 0,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimary: {
    backgroundColor: colors.lime,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

// Made with Bob
