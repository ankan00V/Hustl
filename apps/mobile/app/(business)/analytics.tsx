import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { colors, radii, spacing, typography } from "@/constants/theme";
import { Screen } from "@/components/Screen";

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({
  title,
  value,
  trend,
  up,
  loading,
}: {
  title: string;
  value: string;
  trend: string;
  up: boolean;
  loading: boolean;
}) {
  if (loading) {
    return (
      <View style={styles.statCard}>
        <View style={styles.shimmer} />
      </View>
    );
  }

  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.trendRow}>
        <Ionicons
          name={up ? "arrow-up" : "arrow-down"}
          size={12}
          color={up ? colors.lime : colors.red}
        />
        <Text style={[styles.statTrend, { color: up ? colors.lime : colors.red }]}>
          {trend}
        </Text>
      </View>
    </View>
  );
}

// ─── Bar Chart ───────────────────────────────────────────────
function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value));
  return (
    <View style={styles.barChart}>
      {data.map((d, i) => (
        <View key={i} style={styles.barWrapper}>
          <View style={styles.barBg}>
            <View
              style={[styles.bar, { height: `${(d.value / max) * 100}%`, backgroundColor: colors.lime }]}
            />
          </View>
          <Text style={styles.barLabel}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Pro Gate ────────────────────────────────────────────────
function ProGate({ onUnlock }: { onUnlock: () => void }) {
  return (
    <View style={styles.lockContainer}>
      <View style={styles.lockIconWrapper}>
        <Ionicons name="lock-closed" size={48} color={colors.purple} />
      </View>
      <Text style={styles.lockTitle}>Unlock Hustl PRO+</Text>
      <Text style={styles.lockSubtitle}>
        Get advanced analytics, best times to post, and local skill trends to hire faster.
      </Text>
      <Pressable onPress={onUnlock} style={styles.upgradeBtn}>
        <View
          style={[styles.upgradeBtnGradient, { backgroundColor: colors.lime }]}
        >
          <Text style={styles.upgradeBtnText}>Upgrade to PRO+ ₹1,999/mo</Text>
        </View>
      </Pressable>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function BusinessAnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  const dayData = [
    { label: "M", value: 40 },
    { label: "T", value: 70 },
    { label: "W", value: 100 },
    { label: "T", value: 60 },
    { label: "F", value: 30 },
    { label: "S", value: 80 },
    { label: "S", value: 50 },
  ];

  const skills = ["Barista", "Event Staff", "Photography", "Graphic Design", "Data Entry"];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          {isPro && <Text style={styles.subtitle}>Last 30 days</Text>}
        </View>

        {!isPro ? (
          <ProGate onUnlock={() => setIsPro(true)} />
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <StatCard title="Views" value="1,248" trend="+12%" up loading={loading} />
              <StatCard title="Applicants" value="42" trend="+5%" up loading={loading} />
              <StatCard title="Hired" value="8" trend="-2%" up={false} loading={loading} />
              <StatCard title="Avg Response" value="1.2h" trend="Fast" up loading={loading} />
            </View>

            {/* Best Time Chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Best Time to Post</Text>
              {loading ? (
                <View style={[styles.shimmer, { height: 140, borderRadius: radii.lg }]} />
              ) : (
                <View style={styles.chartCard}>
                  <BarChart data={dayData} />
                </View>
              )}
            </View>

            {/* Top Skills */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Skills in Your Area</Text>
              {loading ? (
                <View style={[styles.shimmer, { height: 40, borderRadius: radii.pill }]} />
              ) : (
                <View style={styles.pillContainer}>
                  {skills.map((skill, i) => (
                    <View key={i} style={styles.skillPill}>
                      <Text style={styles.skillPillText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Conversion Funnel */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hiring Funnel</Text>
              {loading ? (
                <View style={[styles.shimmer, { height: 120, borderRadius: radii.lg }]} />
              ) : (
                <View style={styles.funnelCard}>
                  {[
                    { label: "Impressions", value: 1248, pct: 100, color: colors.lime },
                    { label: "Swipe Right", value: 312, pct: 25, color: colors.lime },
                    { label: "Applied", value: 42, pct: 13, color: colors.amber },
                    { label: "Hired", value: 8, pct: 19, color: colors.green },
                  ].map((row, i) => (
                    <View key={i} style={styles.funnelRow}>
                      <Text style={styles.funnelLabel}>{row.label}</Text>
                      <View style={styles.funnelBarBg}>
                        <View
                          style={[
                            styles.funnelBar,
                            { width: `${row.pct}%` as any, backgroundColor: row.color },
                          ]}
                        />
                      </View>
                      <Text style={styles.funnelValue}>{row.value}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 100 },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  title: { ...typography.headingLarge, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 },

  // Lock / Pro Gate
  lockContainer: {
    margin: spacing.xl,
    padding: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    gap: spacing.md,
  },
  lockIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 0,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  lockTitle: { ...typography.headingMedium, color: colors.textPrimary, textAlign: "center" },
  lockSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  upgradeBtn: { width: "100%", borderRadius: radii.lg, overflow: "hidden", marginTop: spacing.md },
  upgradeBtnGradient: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  upgradeBtnText: { ...typography.button, color: "#000", fontWeight: "900" },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    padding: spacing.lg,
    gap: spacing.xs,
  },
  statTitle: { ...typography.labelSmall, color: colors.textSecondary },
  statValue: { ...typography.headingLarge, color: colors.textPrimary },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  statTrend: { ...typography.bodySmall, fontWeight: "700" },

  // Shimmer
  shimmer: {
    backgroundColor: colors.elevated,
    borderRadius: radii.md,
    height: 100,
  },

  // Section
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: { ...typography.labelSmall, color: colors.textSecondary, letterSpacing: 1.5 },

  // Chart
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    padding: spacing.lg,
  },
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 100,
  },
  barWrapper: { flex: 1, alignItems: "center", gap: 6 },
  barBg: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.elevated,
    borderRadius: 0,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: { width: "100%", borderRadius: 0 },
  barLabel: { ...typography.labelSmall, color: colors.textSecondary, fontSize: 10 },

  // Skills
  pillContainer: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  skillPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.elevated,
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  skillPillText: { ...typography.labelSmall, color: colors.textPrimary, fontSize: 12 },

  // Funnel
  funnelCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    padding: spacing.lg,
    gap: spacing.md,
  },
  funnelRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  funnelLabel: { ...typography.bodySmall, color: colors.textSecondary, width: 90 },
  funnelBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: colors.elevated,
    borderRadius: 0,
    overflow: "hidden",
  },
  funnelBar: { height: 8, borderRadius: 0 },
  funnelValue: { ...typography.monoSmall, color: colors.textPrimary, width: 40, textAlign: "right" },
});
