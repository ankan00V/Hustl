import { useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { colors, typography, spacing, radii, shadows } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";

const studentNavItems = [
  { key: "/(student)/deck", label: "Discover", emoji: "🏠", badge: 0 },
  { key: "/(student)/matches", label: "Matches", emoji: "💖", badge: 0 },
  { key: "/(student)/bookings", label: "Bookings", emoji: "📅", badge: 0 },
  { key: "/(student)/messages", label: "Messages", emoji: "💬", badge: 3 },
  { key: "/(student)/wallet", label: "Earnings", emoji: "💸", badge: 0 },
  { key: "/(student)/reputation", label: "Reputation", emoji: "⭐", badge: 0 },
  { key: "/(student)/badges", label: "Badges", emoji: "🏅", badge: 0 },
  { key: "/(student)/profile", label: "Profile", emoji: "👤", badge: 0 },
];

const businessNavItems = [
  { key: "/(business)/dashboard", label: "Overview", emoji: "📊", badge: 0 },
  { key: "/(business)/jobs", label: "Jobs", emoji: "💼", badge: 0 },
  { key: "/(business)/applicants", label: "Applicants", emoji: "👥", badge: 0 },
  { key: "/(business)/bookings", label: "Bookings", emoji: "📅", badge: 0 },
  { key: "/(business)/payments", label: "Payments", emoji: "💳", badge: 0 },
  { key: "/(business)/analytics", label: "Analytics", emoji: "📈", badge: 0 },
  { key: "/(business)/reviews", label: "Reviews", emoji: "⭐", badge: 0 },
  { key: "/(business)/team", label: "Team", emoji: "👥", badge: 0 },
  { key: "/(business)/settings", label: "Settings", emoji: "⚙️", badge: 0 },
];

export function DesktopSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isBusiness = user?.role === "BUSINESS";
  const navItems = isBusiness ? businessNavItems : studentNavItems;
  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "A";

  return (
    <View style={styles.sidebar}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarScroll}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>
            hust<Text style={styles.logoAccent}>l</Text><Text style={styles.logoBolt}>⚡</Text>
          </Text>
        </View>

        {/* Nav items */}
        <View style={styles.nav}>
          {navItems.map((item) => {
            const active = pathname === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.navItem, active && styles.navItemActive]}
                onPress={() => router.push(item.key as any)}
              >
                {active && <View style={styles.activeIndicator} />}
                <Text style={[styles.navEmoji, active && styles.navEmojiActive]}>{item.emoji}</Text>
                <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                {item.badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.purple }]}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Urgent Hiring CTA */}
        <View style={styles.urgentCard}>
          <View style={styles.urgentHeader}>
            <Text style={styles.urgentEmoji}>🔥</Text>
            <Text style={styles.urgentTitle}>URGENT HIRING</Text>
            <Text style={styles.urgentStar}>✨</Text>
          </View>
          <Text style={styles.urgentDesc}>Get instant notifications for urgent shifts near you.</Text>
          <Pressable style={styles.urgentBtn}>
            <Text style={styles.urgentBtnText}>Enable Now</Text>
          </Pressable>
        </View>

        {/* User mini profile */}
        <View style={styles.userCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{initials}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? "Aarav Singh"}</Text>
            <View style={styles.userRatingRow}>
              <Text style={styles.userRatingIcon}>⭐</Text>
              <Text style={styles.userRatingText}>4.8</Text>
            </View>
            <Pressable onPress={() => router.push(isBusiness ? "/(business)/profile" : "/(student)/profile")}>
              <Text style={styles.userLink}>View profile</Text>
            </Pressable>
          </View>
          <Text style={styles.userMenuIcon}>⋯</Text>
        </View>
      </ScrollView>
    </View>
  );
}

export function DesktopRightPanel() {
  const { user } = useAuthStore();
  const isBusiness = user?.role === "BUSINESS";

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekEarnings = [10, 20, 15, 25, 20, 30, 15];
  const maxE = Math.max(...weekEarnings);

  if (isBusiness) {
    const bizWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const bizSpend = [4000, 8000, 6000, 10000, 8000, 12000, 6000];
    const maxS = Math.max(...bizSpend);

    return (
      <ScrollView style={styles.rightPanel} showsVerticalScrollIndicator={false} contentContainerStyle={styles.rightScroll}>
        {/* Weekly Spend */}
        <View style={styles.rpCard}>
          <View style={styles.rpHeaderRow}>
            <Text style={styles.rpLabel}>This Week Spend</Text>
            <Text style={styles.rpIconChevron}>✕</Text>
          </View>
          <View style={styles.rpEarningsHeader}>
            <Text style={styles.rpEarningsAmount}>₹24,560</Text>
            <Text style={styles.rpTrendLabel}>Spend</Text>
            <Text style={styles.rpTrendText}><Text style={{ color: colors.lime }}>+16%</Text> vs last week</Text>
          </View>
          
          <View style={styles.rpChart}>
            {bizWeekdays.map((day, i) => (
              <View key={day} style={styles.rpBarCol}>
                <View style={styles.rpBarTrackLine} />
                <View
                  style={[
                    styles.rpBarDot,
                    {
                      bottom: `${((bizSpend[i] ?? 0) / maxS) * 80}%`,
                    },
                  ]}
                />
                <Text style={styles.rpBarDay}>{day}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Urgent Hiring */}
        <View style={styles.rpCardTransparent}>
          <View style={styles.rpHeaderRow}>
            <Text style={styles.rpLabel}>Urgent Hiring</Text>
          </View>
          <View style={styles.shiftList}>
            {[
              { title: "Barista", time: "12 mins left", icon: "☕" },
              { title: "Event Staff", time: "45 mins left", icon: "🎵" },
              { title: "Retail Assistant", time: "2 hours left", icon: "🛍️" },
            ].map((shift, i) => (
              <View key={i} style={styles.miniShiftRow}>
                <View style={styles.miniShiftIconBg}><Text style={styles.miniShiftIcon}>{shift.icon}</Text></View>
                <View style={styles.miniShiftInfo}>
                  <Text style={styles.miniShiftCompany}>{shift.title}</Text>
                  <Text style={styles.miniShiftTime}>{shift.time}</Text>
                </View>
              </View>
            ))}
          </View>
          <Pressable style={styles.viewAllRow}><Text style={styles.viewAllText}>View all</Text></Pressable>
        </View>

        {/* New Matches */}
        <View style={styles.rpCardTransparent}>
          <View style={styles.rpHeaderRow}>
            <Text style={styles.rpLabel}>New Applicants</Text>
            <Text style={styles.viewAllText}>See all</Text>
          </View>
          <View style={styles.matchesAvatarRow}>
            {['JD', 'SP', 'AS', 'RM'].map((initials, i) => (
              <View key={i} style={[styles.matchesAvatar, { zIndex: 4 - i, marginLeft: i === 0 ? 0 : -10 }]}>
                <Text style={styles.matchesAvatarText}>{initials}</Text>
              </View>
            ))}
            <View style={[styles.matchesAvatar, styles.matchesAvatarMore, { zIndex: 0, marginLeft: -10 }]}>
              <Text style={styles.matchesAvatarTextMore}>+12</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.rightPanel} showsVerticalScrollIndicator={false} contentContainerStyle={styles.rightScroll}>
      {/* Earnings */}
      <View style={styles.rpCard}>
        <View style={styles.rpHeaderRow}>
          <Text style={styles.rpLabel}>This Week</Text>
          <Text style={styles.rpIconChevron}>✕</Text>
        </View>
        <View style={styles.rpEarningsHeader}>
          <Text style={styles.rpEarningsAmount}>₹4,650</Text>
          <Text style={styles.rpTrendLabel}>Earnings</Text>
          <Text style={styles.rpTrendText}><Text style={{ color: colors.lime }}>+16%</Text> vs last week</Text>
        </View>
        
        <View style={styles.rpChart}>
          {weekDays.map((day, i) => (
            <View key={day} style={styles.rpBarCol}>
              <View style={styles.rpBarTrackLine} />
              <View
                style={[
                  styles.rpBarDot,
                  {
                    bottom: `${((weekEarnings[i] ?? 0) / maxE) * 80}%`,
                  },
                ]}
              />
              <Text style={styles.rpBarDay}>{day}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* Upcoming Shifts */}
      <View style={styles.rpCardTransparent}>
        <View style={styles.rpHeaderRow}>
          <Text style={styles.rpLabel}>Upcoming Shifts</Text>
        </View>
        <View style={styles.shiftList}>
          {[
            { company: "Third Wave Coffee", time: "Today, 6 PM", icon: "☕" },
            { company: "Skyline Events", time: "Tomorrow, 7 PM", icon: "🎵" },
            { company: "Zudio Store", time: "20 May, 11 AM - 5 PM", icon: "🛍️" },
          ].map((shift, i) => (
            <View key={i} style={styles.miniShiftRow}>
              <View style={styles.miniShiftIconBg}><Text style={styles.miniShiftIcon}>{shift.icon}</Text></View>
              <View style={styles.miniShiftInfo}>
                <Text style={styles.miniShiftCompany}>{shift.company}</Text>
                <Text style={styles.miniShiftTime}>{shift.time}</Text>
              </View>
            </View>
          ))}
        </View>
        <Pressable style={styles.viewAllRow}><Text style={styles.viewAllText}>View all</Text></Pressable>
      </View>

      {/* New Matches */}
      <View style={styles.rpCardTransparent}>
        <View style={styles.rpHeaderRow}>
          <Text style={styles.rpLabel}>New Matches</Text>
          <Text style={styles.viewAllText}>See all</Text>
        </View>
        <View style={styles.matchesAvatarRow}>
          {['JD', 'SP', 'AS', 'RM'].map((initials, i) => (
            <View key={i} style={[styles.matchesAvatar, { zIndex: 4 - i, marginLeft: i === 0 ? 0 : -10 }]}>
              <Text style={styles.matchesAvatarText}>{initials}</Text>
            </View>
          ))}
          <View style={[styles.matchesAvatar, styles.matchesAvatarMore, { zIndex: 0, marginLeft: -10 }]}>
            <Text style={styles.matchesAvatarTextMore}>+12</Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.rpCardTransparent}>
        <View style={styles.rpHeaderRow}>
          <Text style={styles.rpLabel}>Your Badges</Text>
          <Text style={styles.viewAllText}>View all</Text>
        </View>
        <View style={styles.badgesGrid}>
          {['⭐', '🌟', '🏆'].map((emoji, i) => (
            <View key={i} style={styles.badgeHex}>
              <Text style={styles.badgeHexEmoji}>{emoji}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // ── Sidebar ──
  sidebar: {
    width: 250,
    backgroundColor: colors.bg,
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.05)",
  },
  sidebarScroll: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.md,
    flexGrow: 1,
  },
  logoContainer: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  logoText: {
    color: colors.bg,
    fontSize: 28,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
    textShadowColor: "white",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  logoAccent: {
    color: colors.amber,
    textShadowColor: colors.amber,
  },
  logoBolt: {
    fontSize: 22,
    marginLeft: 2,
    color: colors.amber,
  },
  nav: { gap: spacing.xs },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    position: "relative",
    overflow: "hidden",
  },
  activeIndicator: {
    position: "absolute",
    left: 0,
    top: 6,
    bottom: 6,
    width: 4,
    backgroundColor: colors.amber,
    borderRadius: 2,
  },
  navItemActive: {
    backgroundColor: "rgba(212, 255, 20, 0.05)",
  },
  navEmoji: { fontSize: 18, opacity: 0.7 },
  navEmojiActive: { opacity: 1 },
  navLabel: { color: colors.textSecondary, fontSize: 15, fontWeight: "600", flex: 1 },
  navLabelActive: { color: colors.amber, fontWeight: "700" },
  badge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: { color: "white", fontSize: 11, fontWeight: "800" },
  
  // Urgent
  urgentCard: {
    backgroundColor: "rgba(157, 78, 221, 0.05)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(157, 78, 221, 0.2)",
    padding: spacing.lg,
    gap: spacing.sm,
    marginTop: "auto",
  },
  urgentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  urgentEmoji: { fontSize: 16 },
  urgentTitle: { color: "white", fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  urgentStar: { fontSize: 14, marginLeft: "auto" },
  urgentDesc: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: spacing.xs },
  urgentBtn: {
    backgroundColor: colors.purple,
    borderRadius: radii.md,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: spacing.md,
    ...shadows.glow,
  },
  urgentBtnText: { color: "white", fontSize: 14, fontWeight: "700" },
  
  // User card
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.md,
    marginTop: spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  userAvatarText: { color: "white", fontSize: 16, fontWeight: "800" },
  userInfo: { gap: 2, flex: 1 },
  userName: { color: "white", fontSize: 14, fontWeight: "700" },
  userRatingRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  userRatingIcon: { fontSize: 10 },
  userRatingText: { color: colors.amber, fontSize: 11, fontWeight: "700" },
  userLink: { color: colors.textMuted, fontSize: 12 },
  userMenuIcon: { color: colors.textMuted, fontSize: 20, fontWeight: "800", paddingHorizontal: spacing.sm },

  // ── Right Panel ──
  rightPanel: {
    width: 320,
    backgroundColor: colors.bg,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.05)",
  },
  rightScroll: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  rpCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    padding: spacing.lg,
    gap: spacing.md,
  },
  rpCardTransparent: {
    padding: spacing.sm,
    gap: spacing.md,
  },
  rpHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rpLabel: { color: "white", fontSize: 16, fontWeight: "700" },
  rpIconChevron: { color: colors.textMuted, fontSize: 20 },
  viewAllText: { color: colors.purple, fontSize: 13, fontWeight: "600" },
  
  // Progress
  rpProgressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  rpLevelTitle: { color: "white", fontSize: 14, fontWeight: "600" },
  rpXP: { color: colors.textMuted, fontSize: 12, fontWeight: "500" },
  rpTrack: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  rpFill: { height: "100%", borderRadius: 3, backgroundColor: colors.amber },
  
  badgeProgressContainer: { flexDirection: "row", gap: spacing.md, alignItems: "center", marginTop: spacing.md, backgroundColor: "rgba(157,78,221,0.1)", padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: "rgba(157,78,221,0.2)" },
  badgeIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  badgeIconText: { fontSize: 24 },
  badgeProgressInfo: { flex: 1, gap: 2 },
  badgeProgressName: { color: "white", fontSize: 13, fontWeight: "700" },
  badgeProgressDesc: { color: colors.textMuted, fontSize: 11, lineHeight: 14 },
  badgeProgressTrackContainer: { marginTop: -spacing.md, paddingHorizontal: spacing.md, paddingBottom: spacing.md, backgroundColor: "rgba(157,78,221,0.1)", borderBottomLeftRadius: radii.lg, borderBottomRightRadius: radii.lg, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "rgba(157,78,221,0.2)" },
  badgeProgressText: { color: colors.textMuted, fontSize: 11, textAlign: "right", marginTop: spacing.xs },
  
  // Stats
  rpStatsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: spacing.xs },
  rpStat: { alignItems: "center", gap: 4 },
  rpStatEmoji: { fontSize: 16 },
  rpStatValue: { color: "white", fontSize: 20, fontWeight: "800" },
  rpStatLabel: { color: colors.textMuted, fontSize: 12 },
  
  // Earnings
  rpEarningsHeader: { gap: 4, marginTop: spacing.xs },
  rpEarningsAmount: { color: "white", fontSize: 28, fontWeight: "800" },
  rpTrendText: { color: colors.textMuted, fontSize: 13, fontWeight: "500" },
  rpChart: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 100,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    position: "relative",
  },
  rpBarCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 8, position: "relative" },
  rpBarTrackLine: {
    position: "absolute",
    bottom: 24, top: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  rpBarDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.purple,
    position: "absolute",
    zIndex: 2,
    ...shadows.glow,
  },
  rpBarDay: { color: colors.textMuted, fontSize: 11, fontWeight: "500", marginTop: "auto" },
  
  badgesGrid: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md },
  badgeShield: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeShieldEmoji: { fontSize: 24 },
  
  shiftCard: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shiftDateBox: {
    backgroundColor: "rgba(212, 255, 20, 0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212, 255, 20, 0.2)",
  },
  shiftMonth: { color: colors.lime, fontSize: 10, fontWeight: "700" },
  shiftDate: { color: colors.lime, fontSize: 16, fontWeight: "800" },
  shiftInfo: { flex: 1, justifyContent: "center" },
  shiftTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  shiftCompany: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  shiftTime: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  applicantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  applicantInfo: {
    flex: 1,
    gap: 2,
  },
  applicantName: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  applicantRole: {
    color: colors.textMuted,
    fontSize: 12,
  },
  miniBtn: {
    backgroundColor: colors.lime,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    ...shadows.glow,
  },
  miniBtnText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "700",
  },
  rpTrendLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: "500", marginTop: 2 },
  shiftList: { gap: spacing.md, marginTop: spacing.sm },
  miniShiftRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.xs },
  miniShiftIconBg: { width: 40, height: 40, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  miniShiftIcon: { fontSize: 18 },
  miniShiftInfo: { flex: 1, gap: 2 },
  miniShiftCompany: { color: "white", fontSize: 13, fontWeight: "600" },
  miniShiftTime: { color: colors.textMuted, fontSize: 11 },
  viewAllRow: { paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)", alignItems: "center", marginTop: spacing.md },
  matchesAvatarRow: { flexDirection: "row", alignItems: "center", paddingVertical: spacing.sm },
  matchesAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#1A1A1A", borderWidth: 2, borderColor: colors.bg, alignItems: "center", justifyContent: "center" },
  matchesAvatarText: { color: "white", fontSize: 14, fontWeight: "700" },
  matchesAvatarMore: { backgroundColor: "rgba(255,255,255,0.1)", borderColor: colors.bg },
  matchesAvatarTextMore: { color: "white", fontSize: 12, fontWeight: "700" },
  badgeHex: { width: 56, height: 64, backgroundColor: "rgba(255,255,255,0.05)", alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "rgba(212, 255, 20, 0.2)" },
  badgeHexEmoji: { fontSize: 24 },
});
