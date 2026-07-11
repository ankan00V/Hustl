import { useState } from "react";
import { StyleSheet, Text, TextInput, View, ViewStyle, TextInputProps } from "react-native";
import { colors, typography, radii, spacing } from "@/constants/theme";

type FieldProps = {
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
  prefix?: string;
  mono?: boolean;
  secureTextEntry?: boolean;
  style?: ViewStyle;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
};

export function Field({
  label,
  placeholder,
  multiline,
  value,
  onChangeText,
  prefix,
  mono,
  secureTextEntry,
  style,
  keyboardType,
  autoCapitalize
}: FieldProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrap, isFocused && styles.inputWrapFocused]}>
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          style={[
            styles.input,
            multiline && styles.multiline,
            mono && styles.mono,
            prefix ? styles.inputWithPrefix : null,
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          textAlignVertical={multiline ? "top" : "center"}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    ...typography.labelSmall,
    letterSpacing: 1.5,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.elevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  inputWrapFocused: {
    borderColor: colors.lime,
  },
  prefix: {
    color: colors.textMuted,
    ...typography.monoMedium,
    paddingLeft: spacing.base,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "500",
    minHeight: 50,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  inputWithPrefix: {
    paddingLeft: spacing.sm,
  },
  multiline: {
    minHeight: 110,
    paddingTop: spacing.md,
  },
  mono: {
    fontFamily: "monospace",
    fontWeight: "700",
    fontSize: 18,
  },
});
