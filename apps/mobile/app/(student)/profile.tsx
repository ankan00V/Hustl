import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { Wallet, Users, History, Share, Settings, LogOut, ChevronRight, User } from "lucide-react-native";
import { useAuthStore } from "@/stores/auth";
import { colors, radii, spacing, typography } from "@/constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  const NavItem = ({ icon: Icon, title, subtitle, route, color = colors.textPrimary }: any) => (
    <Pressable style={styles.navItem} onPress={() => router.push(route)}>
      <View style={[styles.navIcon, { backgroundColor: colors.elevated }]}>
        <Icon size={24} color={color} />
      </View>
      <View style={styles.navContent}>
        <Text style={[styles.navTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.navSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name || "AR").slice(0, 2).toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.nameText}>{user?.name || "Alex Rider"}</Text>
              <Text style={styles.emailText}>{user?.email || "alex@example.com"}</Text>
            </View>
            <Pressable style={styles.settingsBtn} onPress={() => router.push("/(student)/settings")}>
              <Settings size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Hustl Score Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreRow}>
              <View>
                <Text style={styles.scoreTitle}>Hustl Score</Text>
                <Text style={styles.scoreValue}>4.8 / 5.0</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Top 5%</Text>
              </View>
            </View>
            <View style={styles.metricsRow}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>23</Text>
                <Text style={styles.metricLabel}>Shifts</Text>
              </View>
              <View style={styles.metric}>
                <Text style={[styles.metricValue, { color: colors.lime }]}>₹4.5K</Text>
                <Text style={styles.metricLabel}>Earned</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>98%</Text>
                <Text style={styles.metricLabel}>Completion</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Navigation Grid/List */}
        <View style={styles.navSection}>
          <Text style={styles.sectionTitle}>Dashboard</Text>
          <View style={styles.navCard}>
            <NavItem 
              icon={Wallet} 
              title="Wallet & Earnings" 
              subtitle="View balance and payout history"
              route="/(student)/wallet" 
            />
            <NavItem 
              icon={Users} 
              title="Campus Connect" 
              subtitle="See who's working near you"
              route="/(student)/campus_connect" 
            />
            <NavItem 
              icon={History} 
              title="Shift History" 
              route="/(student)/matches" 
            />
            <NavItem 
              icon={Share} 
              title="Refer a Friend" 
              subtitle="Earn ₹500 for each referral"
              route="/(student)/profile" 
            />
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.navSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.navCard}>
            <NavItem 
              icon={User} 
              title="Personal Info" 
              route="/(student)/settings" 
            />
            <Pressable style={styles.navItem} onPress={handleLogout}>
              <View style={[styles.navIcon, { backgroundColor: "rgba(239, 68, 68, 0.1)" }]}>
                <LogOut size={24} color={colors.red} />
              </View>
              <View style={styles.navContent}>
                <Text style={[styles.navTitle, { color: colors.red }]}>Log Out</Text>
              </View>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xxl,
    marginTop: spacing.md,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  avatarWrapper: {
    marginRight: spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.bg,
    fontSize: 24,
    fontWeight: "900",
  },
  headerInfo: {
    flex: 1,
  },
  nameText: {
    color: colors.textPrimary,
    ...typography.headingMedium,
  },
  emailText: {
    color: colors.textSecondary,
    ...typography.bodyMedium,
    marginTop: 2,
  },
  settingsBtn: {
    padding: spacing.sm,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scoreCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  scoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },
  scoreTitle: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreValue: {
    color: colors.textPrimary,
    ...typography.displayMedium,
  },
  badge: {
    backgroundColor: "rgba(200, 243, 58, 0.1)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.lime,
  },
  badgeText: {
    color: colors.lime,
    ...typography.bodySmall,
    fontWeight: "800",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    color: colors.textPrimary,
    ...typography.headingMedium,
    marginBottom: 2,
  },
  metricLabel: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  navSection: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.bodyMedium,
    fontWeight: "700",
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  navCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  navContent: {
    flex: 1,
  },
  navTitle: {
    ...typography.bodyLarge,
    fontWeight: "600",
  },
  navSubtitle: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    marginTop: 2,
  },
});
