import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@hustl/ui";
import { colors, typography, spacing, radii, shadows } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";
import { useProfileStore } from "@/stores/profile";
import { walletApi } from "@/lib/api";

export default function WalletScreen() {
  const user = useAuthStore((s) => s.user);
  const { wallet, setWallet } = useProfileStore();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [upiId, setUpiId] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [requesting, setRequesting] = useState(false);

  // Mock bar chart data
  const chartData = [
    { label: "15", value: 30 },
    { label: "17", value: 50 },
    { label: "19", value: 20 },
    { label: "21", value: 75 },
    { label: "23", value: 90 },
    { label: "25", value: 45 },
  ];

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const [balanceData, txData] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions(1, 10),
      ]);
      setWallet(balanceData.wallet);
      setTransactions(txData.transactions);
    } catch {
      // Wallet might not be complete yet
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!upiId || !withdrawAmount) {
      Alert.alert("Missing Fields", "Please enter UPI ID and amount.");
      return;
    }

    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt < 500) {
      Alert.alert("Invalid Amount", "Minimum withdrawal is ₹500.");
      return;
    }

    const available = parseFloat(wallet?.availableBalance ?? "0");
    if (amt > available) {
      Alert.alert("Insufficient Balance", "You cannot withdraw more than your available balance.");
      return;
    }

    setRequesting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await walletApi.requestPayout(amt, upiId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Payout Requested! 💸", "Your request to withdraw is processing. It will reflect in your bank account shortly.");
      setShowWithdrawForm(false);
      setUpiId("");
      setWithdrawAmount("");
      loadWallet();
    } catch (err: any) {
      Alert.alert("Withdrawal Failed", err.message ?? "Something went wrong.");
    } finally {
      setRequesting(false);
    }
  };

  const TX_LABELS: Record<string, { label: string; color: string; prefix: string }> = {
    SHIFT_EARNING: { label: "Shift Earning", color: colors.green, prefix: "+" },
    PLATFORM_FEE: { label: "Platform Fee", color: colors.red, prefix: "-" },
    WITHDRAWAL: { label: "UPI Withdrawal", color: colors.textSecondary, prefix: "-" },
    BOOST_PURCHASE: { label: "Profile Boost", color: colors.amber, prefix: "-" },
    REFERRAL_REWARD: { label: "Referral Reward", color: colors.green, prefix: "+" },
  };

  // Stats calculation
  const totalCompleted = transactions.filter((t) => t.type === "SHIFT_EARNING").length;
  const totalEarnedStr = wallet?.availableBalance ?? "0.00";

  return (
    <Screen title="Hustl Wallet" subtitle="Manage your earnings and payouts.">
      {/* Earnings Overview */}
      <Card glow="lime">
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.cardLabel}>AVAILABLE BALANCE</Text>
            <Text style={styles.balanceText}>₹{wallet?.availableBalance ?? "0.00"}</Text>
          </View>
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>+18.6% 📈</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalCompleted}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{wallet?.pendingBalance ?? "0.00"}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹183</Text>
            <Text style={styles.statLabel}>Avg / Hour</Text>
          </View>
        </View>

        {/* Action Button */}
        {!showWithdrawForm ? (
          <Pressable style={styles.withdrawBtn} onPress={() => setShowWithdrawForm(true)}>
            <Text style={styles.withdrawBtnText}>Withdraw to UPI</Text>
          </Pressable>
        ) : (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Enter UPI ID (e.g. name@okhdfc)"
              placeholderTextColor={colors.textMuted}
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Withdrawal Amount (Min ₹500)"
              placeholderTextColor={colors.textMuted}
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              keyboardType="numeric"
            />
            <View style={styles.formButtons}>
              <Button size="small" disabled={requesting} onPress={handleWithdraw}>
                {requesting ? "Processing..." : "Confirm"}
              </Button>
              <Button variant="secondary" size="small" onPress={() => setShowWithdrawForm(false)}>
                Cancel
              </Button>
            </View>
          </View>
        )}
        <Text style={styles.withdrawHint}>Min ₹500 · 8% platform fee already deducted</Text>
      </Card>

      {/* Chart Card */}
      <Card>
        <Text style={styles.cardTitle}>Earnings Progress</Text>
        <View style={styles.chart}>
          {chartData.map((bar, index) => (
            <View key={index} style={styles.barCol}>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { height: `${bar.value}%` }]} />
              </View>
              <Text style={styles.barLabel}>{bar.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Transaction List */}
      <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>

      {transactions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💰</Text>
          <Text style={styles.emptyTitle}>No transactions yet</Text>
          <Text style={styles.emptyDesc}>Complete shifts to see ledger records here.</Text>
        </View>
      ) : (
        <View style={styles.txList}>
          {transactions.map((tx: any) => {
            const info = TX_LABELS[tx.type] ?? { label: tx.type, color: colors.textSecondary, prefix: "" };
            return (
              <View key={tx.id} style={styles.txRow}>
                <View style={styles.txRowLeft}>
                  <View style={styles.txIconBox}>
                    <Text style={styles.txIcon}>{info.prefix === "+" ? "↑" : "↓"}</Text>
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{info.label}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.txAmount, { color: info.color }]}>
                  {info.prefix}₹{tx.amount}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
  cardLabel: { color: colors.textMuted, ...typography.labelSmall, letterSpacing: 2 },
  balanceText: { color: colors.amber, ...typography.monoLarge, fontSize: 42, marginTop: 4, textShadowColor: colors.amberGlow, textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  trendBadge: { backgroundColor: "rgba(34, 197, 94, 0.15)", borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(34, 197, 94, 0.3)" },
  trendText: { color: colors.green, fontSize: 12, fontWeight: "800" },
  statsGrid: { flexDirection: "row", justifyContent: "space-between", marginVertical: spacing.md, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: spacing.lg, backgroundColor: "rgba(255, 255, 255, 0.02)", borderRadius: radii.md },
  statBox: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { color: colors.textPrimary, ...typography.monoMedium, fontSize: 20 },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  withdrawBtn: { backgroundColor: colors.lime, borderRadius: radii.lg, paddingVertical: spacing.lg, alignItems: "center", marginTop: spacing.sm, shadowColor: colors.lime, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  withdrawBtnText: { color: colors.bg, fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
  withdrawHint: { color: colors.textSecondary, ...typography.bodySmall, textAlign: "center", marginTop: spacing.md },
  form: { gap: spacing.md, marginTop: spacing.md, backgroundColor: colors.elevated, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, height: 48, color: colors.textPrimary, fontSize: 15 },
  formButtons: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm },
  cardTitle: { color: colors.textPrimary, ...typography.headingSmall, marginBottom: spacing.lg },
  chart: { flexDirection: "row", justifyContent: "space-between", height: 120, gap: spacing.md, paddingHorizontal: spacing.sm },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 8 },
  barTrack: { flex: 1, width: 24, borderRadius: radii.pill, backgroundColor: colors.elevated, justifyContent: "flex-end", overflow: "hidden" },
  barFill: { width: "100%", backgroundColor: colors.amber, borderRadius: radii.pill },
  barLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
  sectionTitle: { color: colors.textMuted, ...typography.labelSmall, letterSpacing: 2, marginTop: spacing.xl, marginBottom: spacing.md, paddingLeft: spacing.xs },
  txList: { gap: spacing.xs, backgroundColor: "transparent" },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.card, paddingHorizontal: spacing.md, paddingVertical: spacing.lg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  txRowLeft: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  txIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.elevated, alignItems: "center", justifyContent: "center" },
  txIcon: { fontSize: 16, color: colors.textSecondary },
  txInfo: { gap: 4 },
  txTitle: { color: colors.textPrimary, ...typography.bodyMedium, fontWeight: "700" },
  txDate: { color: colors.textMuted, fontSize: 12 },
  txAmount: { ...typography.monoMedium, fontSize: 16 },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxxl },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.textPrimary, ...typography.headingMedium },
  emptyDesc: { color: colors.textMuted, ...typography.bodyMedium, textAlign: "center" },
});
