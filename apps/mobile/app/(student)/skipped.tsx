import React from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { X, ArrowRight, RotateCcw } from "lucide-react-native";
import { colors, typography, spacing, radii } from "@/constants/theme";
import { useDeckStore } from "@/stores/deck";
import { EmptyState } from "@/components/EmptyState";

export default function SkippedScreen() {
  const router = useRouter();
  const skippedListings = useDeckStore((s) => s.skippedListings || []);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <X size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Skipped Shifts</Text>
        <View style={{ width: 40 }} />
      </View>

      {skippedListings.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No skipped shifts"
          description="Shifts you skip will appear here in case you change your mind."
          actionLabel="Back to Deck"
          onAction={() => router.back()}
        />
      ) : (
        <FlatList
          data={skippedListings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.logo}>
                  <Text style={styles.logoT}>{(item.businessName ?? "").slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.jobTitle}>{item.title}</Text>
                  <Text style={styles.bizName}>{item.businessName}</Text>
                </View>
                <Text style={styles.payAmt}>₹{item.hourlyRate}</Text>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.timeText}>
                  {formatTime(item.startTime)} - {formatTime(item.endTime)}
                </Text>
                <Pressable style={styles.undoBtn}>
                  <RotateCcw size={14} color={colors.bg} />
                  <Text style={styles.undoText}>Undo Skip</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
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
  list: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: radii.sm,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoT: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  cardInfo: {
    flex: 1,
  },
  jobTitle: {
    color: colors.textPrimary,
    ...typography.bodyLarge,
    fontWeight: "700",
  },
  bizName: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  payAmt: {
    color: colors.textLime,
    ...typography.headingSmall,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  timeText: {
    color: colors.textMuted,
    ...typography.bodySmall,
  },
  undoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lime,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    gap: 4,
  },
  undoText: {
    color: colors.bg,
    ...typography.bodySmall,
    fontWeight: "700",
  },
});
