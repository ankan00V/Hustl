import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { colors, spacing, typography, radii } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ActionBottomBarProps {
  primaryLabel: string;
  onPrimaryPress: () => void;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  isPrimaryDisabled?: boolean;
}

export function ActionBottomBar({
  primaryLabel,
  onPrimaryPress,
  secondaryLabel,
  onSecondaryPress,
  isPrimaryDisabled,
}: ActionBottomBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.base) }]}>
      {secondaryLabel && onSecondaryPress && (
        <TouchableOpacity style={styles.secondaryButton} onPress={onSecondaryPress}>
          <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={[styles.primaryButton, isPrimaryDisabled && styles.primaryButtonDisabled]}
        onPress={onPrimaryPress}
        disabled={isPrimaryDisabled}
      >
        <Text style={[styles.primaryButtonText, isPrimaryDisabled && styles.primaryButtonTextDisabled]}>
          {primaryLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.base,
    gap: spacing.md,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: colors.lime,
    height: 56,
    borderRadius: radii.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: colors.elevated,
  },
  primaryButtonText: {
    ...typography.button,
    color: colors.bg,
  },
  primaryButtonTextDisabled: {
    color: colors.textSecondary,
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.elevated,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    ...typography.button,
    color: colors.textPrimary,
  },
});
