import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet, View, Text } from 'react-native';
import { colors, radii, typography, spacing } from '@/constants/theme';

interface GlowInputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const GlowInput: React.FC<GlowInputProps> = ({ label, error, onFocus, onBlur, style, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = error ? colors.red : isFocused ? colors.lime : colors.border;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          { borderColor },
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.base,
  },
  label: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    borderWidth: 3,
    borderRadius: 0,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  input: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    padding: spacing.md,
    minHeight: 48,
  },
  error: {
    ...typography.bodySmall,
    color: colors.red,
    marginTop: spacing.xs,
  },
});
