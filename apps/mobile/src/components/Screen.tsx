import type { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from "@/constants/theme";

type ScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  scroll?: boolean;
  noPadding?: boolean;
}>;

export function Screen({ title, subtitle, children, scroll = true, noPadding = false }: ScreenProps) {
  const content = (
    <View style={[styles.content, noPadding && styles.noPad]}>
      <View style={styles.header}>
        <Text style={styles.brand}>HUSTL</Text>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  noPad: {
    paddingHorizontal: 0,
  },
  header: {
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  brand: {
    color: colors.lime,
    ...typography.labelSmall,
    letterSpacing: 2,
  },
  title: {
    color: colors.textPrimary,
    ...typography.headingLarge,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.bodyMedium,
    lineHeight: 22,
  },
});
