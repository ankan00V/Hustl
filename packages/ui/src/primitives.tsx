import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, type ViewStyle, type TextStyle } from "react-native";

// ── Inline theme tokens (UI package cannot import from mobile app) ──
const _colors = {
  bg: "#050505",
  lime: "#D4FF14",
  limeDark: "#AACC00",
  purple: "#9D4EDD",
  red: "#EF4444",
  redGlow: "rgba(239, 68, 68, 0.20)",
  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  glassMedium: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.10)",
};

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "default" | "small" | "large";
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}>;

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "default",
  disabled = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        sizeStyles[size],
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        pressed && !disabled && variant === "primary" && styles.pressedPrimary,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "secondary" && styles.secondaryLabel,
          variant === "ghost" && styles.ghostLabel,
          variant === "danger" && styles.dangerLabel,
          size === "small" && styles.smallLabel,
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function AccentButton({
  children,
  onPress,
  fullWidth = false,
  style,
}: Omit<ButtonProps, "variant" | "size">) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles.accentButton,
        sizeStyles.default,
        pressed && styles.pressed,
        pressed && styles.pressedAccent,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      <Text style={[styles.label, styles.accentLabel]}>{children}</Text>
    </Pressable>
  );
}

type BadgeProps = PropsWithChildren<{
  variant?: "default" | "success" | "warning" | "error";
  style?: ViewStyle;
}>;

export function Badge({ children, variant = "default", style }: BadgeProps) {
  return (
    <Pressable style={[styles.badge, styles[`badge_${variant}`], style]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>{children}</Text>
    </Pressable>
  );
}

type MonoTextProps = PropsWithChildren<{
  style?: TextStyle;
}>;

export function MonoText({ children, style }: MonoTextProps) {
  return <Text style={[styles.monoText, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: 20,
    justifyContent: "center",
    paddingHorizontal: 24,
    flexDirection: "row",
    gap: 8,
  },
  primary: {
    backgroundColor: _colors.lime,
    shadowColor: _colors.lime,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  secondary: {
    backgroundColor: _colors.glassMedium,
    borderWidth: 1,
    borderColor: _colors.borderLight,
  },
  danger: {
    backgroundColor: _colors.redGlow,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.30)",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  accentButton: {
    backgroundColor: _colors.purple,
    shadowColor: _colors.purple,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  pressedPrimary: {
    backgroundColor: _colors.limeDark,
  },
  pressedAccent: {
    backgroundColor: "#7B2CBF",
  },
  fullWidth: {
    width: "100%",
  },
  label: {
    color: _colors.bg,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  accentLabel: {
    color: "#FAFAFA",
  },
  secondaryLabel: {
    color: _colors.textPrimary,
  },
  ghostLabel: {
    color: _colors.textSecondary,
  },
  dangerLabel: {
    color: _colors.red,
    fontWeight: "700",
  },
  smallLabel: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: _colors.glassMedium,
    borderWidth: 1,
    borderColor: _colors.borderLight,
    alignSelf: "flex-start",
  },
  badge_default: {},
  badge_success: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  badge_warning: {
    backgroundColor: "rgba(212, 255, 20, 0.15)",
    borderColor: "rgba(212, 255, 20, 0.3)",
  },
  badge_error: {
    backgroundColor: _colors.redGlow,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: _colors.textPrimary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  badgeText_default: {},
  badgeText_success: {
    color: "#4ADE80",
  },
  badgeText_warning: {
    color: _colors.lime,
  },
  badgeText_error: {
    color: _colors.red,
  },
  monoText: {
    fontFamily: "monospace",
    color: _colors.textPrimary,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    minHeight: 38,
    paddingHorizontal: 16,
  },
  default: {
    minHeight: 52,
  },
  large: {
    minHeight: 58,
    paddingHorizontal: 32,
  },
});
