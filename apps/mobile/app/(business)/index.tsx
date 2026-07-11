import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors, radii, spacing, typography } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";
import { listingsApi, matchesApi } from "@/lib/api";

interface DashStats {
  activeListings: number;
  pendingMatches: number;
  weeklySpend: string;
  avgRating: string;
}

interface RecentMatch {
  id: string;
  student?: { name: string; reputationScore?: number };
  listing: { title: string };
  status: string;
}

export default function BusinessDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashStats>({
    activeListings: 4,
    pendingMatches: 12,
    weeklySpend: "₹18.5K",
    avgRating: "4.9",
  });
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const matchData = await matchesApi.list();
      setRecentMatches((matchData.matches || []).slice(0, 5) as RecentMatch[]);
    } catch {
      // use fallback mock data
      setRecentMatches([
        { id: "1", student: { name: "Alex Rider", reputationScore: 4.9 }, listing: { title: "Evening Barista" }, status: "PENDING" },
        { id: "2", student: { name: "Sam Wilson", reputationScore: 4.7 }, listing: { title: "Weekend Cashier" }, status: "ACCEPTED" },
        { id: "3", student: { name: "Jamie Lee", reputationScore: 4.8 }, listing: { title: "Event Staff" }, status: "CHECKED_IN" },
      ]);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, []);

  const statusColor = (status: string) => {
    if (status === "CHECKED_IN") return colors.lime;
    if (status === "ACCEPTED") return colors.amber;
    if (status === "CANCELLED") return colors.red;
    return colors.textSecondary;
  };

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: "Pending",
      ACCEPTED: "Scheduled",
      CHECKED_IN: "On Shift",
      COMPLETED: "Done",
      CANCELLED: "Declined",
    };
    return map[status] ?? status;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lime} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning 👋</Text>
            <Text style={styles.businessName}>{user?.name ?? "Your Business"}</Text>
          </View>
          <Pressable
            style={styles.notifBtn}
            onPress={() => router.push("/(business)/inbox")}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Quick Post CTA */}
        <Pressable onPress={() => router.push("/(business)/post")} style={[styles.ctaBanner, { borderWidth: 3, borderColor: "#FFFFFF", backgroundColor: colors.lime }]}>
          <View style={[styles.ctaGradient, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
            <View style={styles.ctaContent}>
              <Ionicons name="flash" size={22} color="#000" />
              <View>
                <Text style={styles.ctaTitle}>Post a Shift</Text>
                <Text style={styles.ctaSubtitle}>Students swipe in minutes</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#000" />
          </View>
        </Pressable>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: "Active Shifts", value: String(stats.activeListings), icon: "document-text-outline", trend: "+2 this week", up: true },
            { label: "New Applicants", value: String(stats.pendingMatches), icon: "people-outline", trend: "Review now", up: true },
            { label: "Week Spend", value: stats.weeklySpend, icon: "cash-outline", trend: "+15% vs last", up: true },
            { label: "Avg Rating", value: stats.avgRating, icon: "star-outline", trend: "Top 5%", up: true },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Ionicons name={stat.icon as any} size={16} color={colors.textSecondary} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={[styles.statTrend, { color: stat.up ? colors.lime : colors.red }]}>
                {stat.trend}
              </Text>
            </View>
          ))}
        </View>

        {/* Recent Applicants */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>RECENT APPLICANTS</Text>
            <Pressable onPress={() => router.push("/(business)/inbox")}>
              <Text style={styles.seeAll}>See all →</Text>
            </Pressable>
          </View>
          <View style={styles.applicantList}>
            {recentMatches.map((match) => (
              <Pressable
                key={match.id}
                style={styles.applicantItem}
                onPress={() => router.push("/(business)/inbox")}
              >
                <View style={styles.applicantAvatar}>
                  <Text style={styles.applicantInitials}>
                    {(match.student?.name ?? "ST").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.applicantInfo}>
                  <Text style={styles.applicantName}>{match.student?.name ?? "Student"}</Text>
                  <Text style={styles.applicantRole}>{match.listing.title}</Text>
                </View>
                <View style={styles.applicantRight}>
                  {match.student?.reputationScore && (
                    <Text style={styles.applicantRating}>
                      ★ {match.student.reputationScore.toFixed(1)}
                    </Text>
                  )}
                  <View style={[styles.statusDot, { backgroundColor: statusColor(match.status) }]} />
                  <Text style={[styles.statusText, { color: statusColor(match.status) }]}>
                    {statusLabel(match.status)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
          <View style={styles.quickActions}>
            {[
              { icon: "people-outline", label: "Review Inbox", route: "/(business)/inbox", color: colors.textPrimary },
              { icon: "bar-chart-outline", label: "Analytics", route: "/(business)/analytics", color: colors.lime },
              { icon: "person-outline", label: "My Profile", route: "/(business)/profile", color: colors.amber },
            ].map((action, i) => (
              <Pressable
                key={i}
                style={styles.quickAction}
                onPress={() => router.push(action.route as any)}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: colors.elevated }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 100 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  greeting: { ...typography.bodyMedium, color: colors.textSecondary },
  businessName: { ...typography.headingLarge, color: colors.textPrimary, marginTop: 2 },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  ctaBanner: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.xl,
    borderRadius: 0,
    overflow: "hidden",
  },
  ctaGradient: { padding: spacing.lg },
  ctaContent: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.md },
  ctaTitle: { ...typography.headingSmall, color: "#000", fontWeight: "900" },
  ctaSubtitle: { ...typography.bodySmall, color: "rgba(0,0,0,0.6)", marginTop: 2 },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  statCard: {
    width: "47%",
    backgroundColor: colors.card,
    borderRadius: 0,
    padding: spacing.lg,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    gap: 4,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  statLabel: { ...typography.labelSmall, color: colors.textSecondary, fontSize: 11 },
  statValue: { ...typography.headingLarge, color: colors.textPrimary },
  statTrend: { ...typography.labelSmall, fontSize: 11 },

  section: { paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: { ...typography.labelSmall, color: colors.textSecondary, letterSpacing: 1.5 },
  seeAll: { ...typography.bodySmall, color: colors.lime, fontWeight: "700" },

  applicantList: { gap: spacing.md },
  applicantItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    gap: spacing.md,
  },
  applicantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  applicantInitials: { color: "#000", fontSize: 15, fontWeight: "800" },
  applicantInfo: { flex: 1 },
  applicantName: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: "700" },
  applicantRole: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  applicantRight: { alignItems: "flex-end", gap: 4 },
  applicantRating: { ...typography.bodySmall, color: colors.lime, fontWeight: "700" },
  statusDot: { width: 6, height: 6, borderRadius: 0 },
  statusText: { fontSize: 11, fontWeight: "700" },

  quickActions: { flexDirection: "row", gap: spacing.md },
  quickAction: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 0,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 11,
  },
});
