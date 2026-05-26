import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@hustl/ui";
import { colors, typography, spacing, radii, shadows } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";
import { useProfileStore } from "@/stores/profile";
import { profileApi } from "@/lib/api";

const TIER_CONFIG = {
  FREE: { label: "FREE MEMBERSHIP", color: colors.textMuted, icon: "🆓" },
  PRO: { label: "PRO MEMBER", color: colors.amber, icon: "⚡" },
  ELITE: { label: "ELITE PARTNER", color: "#3B82F6", icon: "👑" },
  PRO_PLUS: { label: "PRO+ PARTNER", color: colors.green, icon: "🚀" },
};

export default function BusinessProfileScreen() {
  const { user, logout } = useAuthStore();
  const { businessProfile, setBusinessProfile } = useProfileStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await profileApi.get(user.id);
      if (data.businessProfile) {
        setBusinessProfile(data.businessProfile);
      }
    } catch {
      // Fallback profile
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/");
  };

  const tier = businessProfile?.currentTier ?? "FREE";
  const tierInfo = TIER_CONFIG[tier] ?? TIER_CONFIG.FREE;

  return (
    <Screen title={businessProfile?.businessName ?? user?.name ?? "Business"} subtitle="Your business profile and active subscriptions.">
      {/* Membership Card */}
      <Card glow="lime">
        <View style={styles.tierRow}>
          <Text style={styles.tierIcon}>{tierInfo.icon}</Text>
          <View style={styles.tierInfo}>
            <Text style={[styles.tierLabel, { color: tierInfo.color }]}>{tierInfo.label}</Text>
            <Text style={styles.tierHint}>
              {tier === "FREE"
                ? "Standard tier · 2 active listings · No urgent mode"
                : "PRO tier · Unlimited listings · Urgent hiring alerts · Advanced analytics"}
            </Text>
          </View>
        </View>
        {tier === "FREE" && (
          <Button style={styles.upgradeBtn} onPress={() => {}}>
            Upgrade to PRO — ₹999/mo →
          </Button>
        )}
      </Card>

      {/* Analytics KPI Dashboard (PRO Value Anchor) */}
      <Text style={styles.sectionTitle}>HUSTL ANALYTICS</Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>📈</Text>
          <Text style={styles.statValue}>95%</Text>
          <Text style={styles.statLabel}>Match Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>⏱️</Text>
          <Text style={styles.statValue}>12m</Text>
          <Text style={styles.statLabel}>Avg Match Time</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>42</Text>
          <Text style={styles.statLabel}>Swipes / List</Text>
        </View>
      </View>

      {/* Business Info Details */}
      <Text style={styles.sectionTitle}>COMPANY INFORMATION</Text>
      <Card>
        <View style={styles.detailList}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>COMPANY NAME</Text>
            <Text style={styles.detailValue}>{businessProfile?.businessName ?? user?.name ?? "Brew Lane Cafe"}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>INDUSTRY CATEGORY</Text>
            <Text style={styles.detailValue}>{businessProfile?.category ?? "Café / Food & Bev"}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>OFFICE ADDRESS</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{businessProfile?.address ?? "80 Feet Rd, Koramangala, Bengaluru"}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>VERIFIED COMPANY</Text>
            <Text style={[styles.detailValue, { color: colors.green }]}>✓ Approved & Verified</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>TRUST RATING</Text>
            <Text style={[styles.detailValue, { color: colors.amber }]}>★ {user?.reputationScore?.toFixed(1) ?? "4.9"}</Text>
          </View>
        </View>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        <Button variant="secondary" onPress={() => {}}>
          Edit Company Profile
        </Button>
        <Button variant="danger" onPress={handleLogout}>
          Log Out
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tierRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  tierIcon: { fontSize: 32 },
  tierInfo: { flex: 1, gap: 2 },
  tierLabel: { fontSize: 18, fontWeight: "900", letterSpacing: 1 },
  tierHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  upgradeBtn: { marginTop: spacing.md, width: "100%" },
  sectionTitle: { color: colors.textMuted, ...typography.labelSmall, letterSpacing: 2, marginTop: spacing.lg, marginBottom: spacing.sm },
  statsRow: { flexDirection: "row", gap: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.base, alignItems: "center", gap: spacing.xs },
  statEmoji: { fontSize: 20 },
  statValue: { color: colors.textPrimary, ...typography.monoMedium, fontSize: 22 },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: "700" },
  detailList: { gap: 0 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: spacing.md },
  detailLabel: { color: colors.textMuted, ...typography.labelSmall, letterSpacing: 1.5 },
  detailValue: { color: colors.textPrimary, ...typography.bodyMedium, fontWeight: "600" },
  separator: { height: 1, backgroundColor: colors.border },
  actions: { gap: spacing.md, marginTop: spacing.xl },
});
