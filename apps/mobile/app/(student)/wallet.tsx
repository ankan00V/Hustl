import { View, Text, StyleSheet, Pressable, SafeAreaView, ScrollView } from "react-native";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { X, ArrowDownLeft, ArrowUpRight, Award, Zap } from "lucide-react-native";
import { colors, radii, spacing, typography } from "@/constants/theme";
import { api } from "@/lib/api";
import { WithdrawalSheet } from "@/components/WithdrawalSheet";

const TX_LABELS: Record<string, any> = {
  PAYOUT: { label: "Withdrawal", color: colors.textPrimary, prefix: "-", icon: ArrowUpRight },
  SHIFT_PAY: { label: "Shift Earnings", color: colors.lime, prefix: "+", icon: ArrowDownLeft },
  BONUS: { label: "Performance Bonus", color: colors.lime, prefix: "+", icon: Award },
};

export default function WalletScreen() {
  const router = useRouter();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const data = await api<any>("/wallet");
      setWallet(data.wallet);
      const txData = await api<any>("/wallet/transactions");
      setTransactions(txData.transactions || []);
    } catch (e) {
      // ignore
    }
  };

  const chartData = [
    { label: "Mon", value: 30 },
    { label: "Tue", value: 60 },
    { label: "Wed", value: 40 },
    { label: "Thu", value: 90 },
    { label: "Fri", value: 50 },
    { label: "Sat", value: 100 },
    { label: "Sun", value: 0 },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <X size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Main Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.cardLabel}>AVAILABLE BALANCE</Text>
            <View style={styles.trendBadge}>
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>
          <Text style={styles.balanceText}>₹{wallet?.balance ?? "0.00"}</Text>

          {/* Action Button */}
          <Pressable style={styles.withdrawBtn} onPress={() => setShowWithdrawForm(true)}>
            <Text style={styles.withdrawBtnText}>Withdraw to UPI</Text>
          </Pressable>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>₹{wallet?.pendingBalance ?? "0.00"}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statBox, { borderRightWidth: 0 }]}>
            <Text style={styles.statValue}>₹183</Text>
            <Text style={styles.statLabel}>Avg / Hour</Text>
          </View>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>EARNINGS PROGRESS</Text>
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
        </View>

        {/* Transaction List */}
        <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>

        {transactions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDesc}>Complete shifts to see ledger records here.</Text>
          </View>
        ) : (
          <View style={styles.txList}>
            {transactions.map((tx: any) => {
              const info = TX_LABELS[tx.type] ?? { label: tx.type, color: colors.textSecondary, prefix: "", icon: Zap };
              const Icon = info.icon;
              return (
                <View key={tx.id} style={styles.txRow}>
                  <View style={styles.txRowLeft}>
                    <View style={styles.txIconBox}>
                      <Icon size={20} color={info.color} />
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
      </ScrollView>

      {/* Withdrawal Bottom Sheet */}
      <WithdrawalSheet
        visible={showWithdrawForm}
        onClose={() => setShowWithdrawForm(false)}
        availableBalance={wallet?.balance || 0}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.textPrimary,
    ...typography.headingMedium,
  },
  scroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: colors.border,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cardLabel: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  balanceText: {
    color: colors.textPrimary,
    ...typography.displayLarge,
    marginBottom: spacing.lg,
  },
  trendBadge: {
    backgroundColor: colors.bg,
    borderRadius: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderWidth: 3,
    borderColor: colors.lime,
  },
  trendText: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "800",
  },
  withdrawBtn: {
    backgroundColor: colors.lime,
    borderRadius: 0,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  withdrawBtnText: {
    color: colors.bg,
    ...typography.bodyLarge,
    fontWeight: "800",
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  statValue: {
    color: colors.textPrimary,
    ...typography.headingMedium,
    marginBottom: 4,
  },
  statLabel: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 120,
    gap: spacing.sm,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  barTrack: {
    width: "100%",
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: 0,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    width: "100%",
    backgroundColor: colors.lime,
    borderRadius: 0,
  },
  barLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  txList: {
    gap: spacing.sm,
  },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: colors.border,
  },
  txRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  txIconBox: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: {
    gap: 2,
  },
  txTitle: {
    color: colors.textPrimary,
    ...typography.bodyLarge,
    fontWeight: "700",
  },
  txDate: {
    color: colors.textMuted,
    ...typography.bodySmall,
  },
  txAmount: {
    ...typography.headingSmall,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.textPrimary,
    ...typography.bodyLarge,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  emptyDesc: {
    color: colors.textMuted,
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
});
