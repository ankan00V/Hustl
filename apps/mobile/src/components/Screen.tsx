import type { PropsWithChildren, ReactNode } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, typography, spacing } from "@/constants/theme";

type ScreenProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  noPadding?: boolean;
  rightElement?: ReactNode;
}>;

export function Screen({ title, subtitle, children, scroll = true, noPadding = false, rightElement }: ScreenProps) {
  const content = (
    <View style={[styles.content, noPadding && styles.noPad]}>
      {title && (
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={styles.brand}>HUSTL</Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
        </View>
      )}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: spacing.sm,
  },
  header: {
    gap: spacing.sm,
    flex: 1,
  },
  rightElement: {
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
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
