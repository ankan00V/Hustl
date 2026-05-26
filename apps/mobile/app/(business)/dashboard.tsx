import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { colors, typography, spacing, radii, shadows } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";
import { listingsApi } from "@/lib/api";
import { LinearGradient } from "expo-linear-gradient";

export default function BusinessDashboard() {
  const user = useAuthStore((s) => s.user);
  const [listings, setListings] = useState<any[]>([]);
  const [stats, setStats] = useState({ active: 0, matched: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await listingsApi.search({ lat: 12.9352, lng: 77.6245, radius: 50000 });
      const myListings = data.listings ?? [];
      setListings(myListings);
      setStats({
        active: myListings.filter((l: any) => l.status === "OPEN").length,
        matched: myListings.filter((l: any) => l.status === "MATCHED").length,
        total: myListings.length,
      });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const STATUS_DOT: Record<string, string> = {
    OPEN: colors.green,
    MATCHED: colors.amber,
    FILLED: "#3B82F6",
    CLOSED: colors.textMuted,
  };

  return (
    <Screen title="Overview" subtitle={`Manage your shifts and applicants at ${user?.name ?? "Hustl"}`}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <Text style={styles.titleText}>Overview</Text>
          <Pressable style={styles.postBtn} onPress={() => router.push("/(business)/post")}>
            <LinearGradient
              colors={['#D4FF14', '#AACC00']}
              style={styles.postGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.postBtnText}>+ Post a Job</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>ACTIVE JOBS</Text>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statSubText}>Receiving applications</Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>TOTAL APPLICANTS</Text>
              <Text style={[styles.statValue, { color: colors.purple }]}>156</Text>
              <Text style={styles.statSubText}>Across all jobs</Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>NEW MATCHES</Text>
              <Text style={[styles.statValue, { color: colors.lime }]}>32</Text>
              <Text style={styles.statSubText}>Last 24 hours</Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.stat}>
              <Text style={styles.statLabel}>MATCH RATE</Text>
              <Text style={[styles.statValue, { color: colors.amber }]}>84%</Text>
              <Text style={styles.statSubText}>+5% vs last month</Text>
            </View>
          </Card>
        </View>

        {/* Chart and Active Jobs Table */}
        <View style={styles.dashboardGrid}>
          {/* Analytics Chart */}
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>APPLICANT FLOW</Text>
            <Card style={styles.chartCard}>
              <View style={styles.chartContainer}>
                {[4, 10, 15, 8, 22, 18, 30].map((val, idx) => (
                  <View key={idx} style={styles.chartBarCol}>
                    <View style={[styles.chartBar, { height: `${(val / 30) * 100}%` }]}>
                      <LinearGradient
                        colors={['#D4FF14', '#5B21B6']}
                        style={StyleSheet.absoluteFillObject}
                      />
                    </View>
                    <Text style={styles.chartLabel}>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][idx]}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </View>

          {/* Active Jobs Table */}
          <View style={styles.tableSection}>
            <Text style={styles.sectionTitle}>ACTIVE JOBS</Text>
            <Card style={styles.tableCard}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeader, { flex: 2 }]}>ROLE</Text>
                <Text style={[styles.tableHeader, { flex: 1 }]}>WAGE</Text>
                <Text style={[styles.tableHeader, { flex: 1.5 }]}>MATCHES</Text>
                <Text style={[styles.tableHeader, { flex: 1 }]}>STATUS</Text>
              </View>
              {[
                { role: "Barista", wage: "₹250/hr", matches: 12, status: "OPEN" },
                { role: "Event Staff", wage: "₹300/hr", matches: 45, status: "URGENT", statusColor: colors.amber },
                { role: "Retail Asst", wage: "₹200/hr", matches: 8, status: "MATCHED", statusColor: colors.purple },
              ].map((job, idx) => (
                <View key={idx} style={[styles.tableRow, idx !== 0 && styles.tableRowBorder]}>
                  <Text style={[styles.tableCell, { flex: 2, fontWeight: '700', color: "white" }]}>{job.role}</Text>
                  <Text style={[styles.tableCell, { flex: 1, color: colors.textSecondary }]}>{job.wage}</Text>
                  <View style={[{ flex: 1.5, flexDirection: "row", alignItems: "center" }]}>
                    <View style={styles.matchesAvatarRow}>
                      {['JD', 'SP'].map((init, i) => (
                        <View key={i} style={[styles.matchesAvatar, { zIndex: 2 - i, marginLeft: i === 0 ? 0 : -8 }]}>
                          <Text style={styles.matchesAvatarText}>{init}</Text>
                        </View>
                      ))}
                      <View style={[styles.matchesAvatar, styles.matchesAvatarMore, { zIndex: 0, marginLeft: -8 }]}>
                        <Text style={styles.matchesAvatarTextMore}>+{job.matches - 2}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={[{ flex: 1, alignItems: "flex-start" }]}>
                    <View style={[styles.statusBadge, job.statusColor ? { backgroundColor: `rgba(${job.statusColor === colors.amber ? '255,193,7' : '157,78,221'}, 0.1)`, borderColor: job.statusColor } : {}]}>
                      <Text style={[styles.statusBadgeText, job.statusColor && { color: job.statusColor }]}>{job.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  titleText: {
    color: colors.textPrimary,
    ...typography.displayMedium,
  },
  postBtn: {
    borderRadius: radii.pill,
    overflow: "hidden",
    ...shadows.glow,
  },
  postGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  postBtnText: {
    color: "#000",
    fontSize: 14,
    fontWeight: "800",
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
  },
  stat: {
    gap: spacing.xs,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: "800",
    fontFamily: "monospace",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  statSubText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xl,
    marginBottom: spacing.xl,
  },
  chartSection: {
    flex: 1,
    minWidth: 320,
    gap: spacing.md,
  },
  applicantsSection: {
    flex: 1,
    minWidth: 320,
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  chartCard: {
    height: 200,
    justifyContent: "flex-end",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: "100%",
    paddingTop: spacing.md,
  },
  chartBarCol: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
  },
  chartBar: {
    width: 12,
    borderRadius: radii.sm,
    overflow: "hidden",
    backgroundColor: colors.border,
  },
  chartLabel: {
    color: colors.textMuted,
    fontSize: 9,
  },
  applicantList: {
    gap: spacing.md,
  },
  applicantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  applicantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: "800",
  },
  applicantInfo: {
    flex: 1,
    gap: 2,
  },
  applicantName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700",
  },
  applicantRole: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  applicantRating: {
    backgroundColor: colors.glassMedium,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  ratingText: {
    color: colors.amber,
    fontSize: 12,
    fontWeight: "700",
  },
  listingList: {
    gap: spacing.md,
  },
  listingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  listingInfo: {
    flex: 1,
    gap: 2,
  },
  listingTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "700",
  },
  listingMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  listingActions: {
    alignItems: "flex-end",
  },
  listingStatus: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  empty: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyDesc: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: "center",
  },
  tableSection: {
    flex: 2,
    minWidth: 400,
    gap: spacing.md,
  },
  tableCard: {
    padding: 0,
    overflow: "hidden",
  },
  tableHeaderRow: {
    flexDirection: "row",
    padding: spacing.md,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeader: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: "row",
    padding: spacing.md,
    alignItems: "center",
  },
  tableRowBorder: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  tableCell: {
    fontSize: 14,
  },
  matchesAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  matchesAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#1A1A1A",
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  matchesAvatarText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  matchesAvatarMore: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: colors.surface,
  },
  matchesAvatarTextMore: {
    color: "white",
    fontSize: 9,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
