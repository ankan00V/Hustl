import React, { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { Clock, Calendar, IndianRupee, MapPin, CheckCircle2, Search } from "lucide-react-native";
import { colors, spacing, radii, typography } from "@/constants/theme";
import { matchesApi } from "@/lib/api";
import { SegmentedControl } from "@/components/SegmentedControl";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@hustl/ui";

interface Match {
  id: string;
  status: string;
  listing: {
    title: string;
    hourlyRate: string;
    totalHours: number;
    startTime: string;
    endTime: string;
    businessName: string;
    businessCategory: string;
  };
  checkInTime: string | null;
  checkOutTime: string | null;
  createdAt: string;
}

export default function MatchesScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("Active");

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await matchesApi.list();
      setMatches(data.matches);
    } catch (error) {
      console.error("Failed to load matches:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return colors.textMuted;
      case "ACCEPTED":
        return colors.lime;
      case "CHECKED_IN":
        return colors.purple;
      case "COMPLETED":
        return colors.textSecondary;
      case "CANCELLED":
        return colors.red;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Applied";
      case "ACCEPTED":
        return "Accepted";
      case "CHECKED_IN":
        return "Checked In";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const activeMatches = matches.filter(m => ["PENDING", "ACCEPTED", "CHECKED_IN"].includes(m.status));
  const pastMatches = matches.filter(m => ["COMPLETED", "CANCELLED"].includes(m.status));

  const displayedMatches = activeTab === "Active" ? activeMatches : pastMatches;

  const renderMatch = ({ item }: { item: Match }) => (
    <Pressable
      style={styles.matchCard}
      onPress={() => router.push(`/(student)/match/${item.id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.businessLogo}>
          <Text style={styles.logoText}>
            {item.listing.businessName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.jobTitle}>{item.listing.title}</Text>
          <Text style={styles.businessName}>{item.listing.businessName}</Text>
        </View>
        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.detailsRow}>
        <View style={styles.detailItem}>
          <IndianRupee size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>₹{item.listing.hourlyRate}/hr</Text>
        </View>
        <View style={styles.detailItem}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{item.listing.totalHours} hrs</Text>
        </View>
        <View style={styles.detailItem}>
          <Calendar size={16} color={colors.textSecondary} />
          <Text style={styles.detailText}>{formatDate(item.listing.startTime)}</Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <Text style={styles.timeText}>
          {formatTime(item.listing.startTime)} - {formatTime(item.listing.endTime)}
        </Text>
      </View>

      {item.status === "ACCEPTED" && (
        <View style={styles.actionHint}>
          <MapPin size={16} color={colors.lime} />
          <Text style={styles.actionText}>Ready to check in</Text>
        </View>
      )}

      {item.status === "CHECKED_IN" && (
        <View style={styles.actionHint}>
          <CheckCircle2 size={16} color={colors.purple} />
          <Text style={[styles.actionText, { color: colors.purple }]}>Currently working</Text>
        </View>
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.lime} />
          <Text style={styles.loadingText}>Loading applications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Applications</Text>
        <SegmentedControl
          options={["Active", "Past"]}
          selected={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {displayedMatches.length === 0 ? (
        <View style={styles.emptyContainer}>
          {activeTab === "Active" ? (
            <EmptyState
              icon={Search}
              title="No active applications"
              description="You haven't applied to any shifts recently. Check out the deck to find new opportunities."
              actionLabel="Find Shifts"
              onAction={() => router.push("/(student)/deck")}
            />
          ) : (
            <EmptyState
              icon={Clock}
              title="No past applications"
              description="Your completed and cancelled shifts will appear here."
            />
          )}
        </View>
      ) : (
        <FlatList
          data={displayedMatches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.lime}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: spacing.lg, gap: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.headingLarge, color: colors.textPrimary },
  listContent: { padding: spacing.lg, gap: spacing.lg },
  matchCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  businessLogo: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  headerInfo: { flex: 1 },
  jobTitle: { ...typography.bodyLarge, color: colors.textPrimary, fontWeight: "700" },
  businessName: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  detailsRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.md },
  detailItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  detailText: { ...typography.bodySmall, color: colors.textSecondary, fontWeight: "600" },
  timeRow: { marginTop: spacing.md },
  timeText: { ...typography.bodySmall, color: colors.textMuted },
  actionHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionText: { ...typography.bodySmall, color: colors.lime, fontWeight: "700" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  loadingText: { ...typography.bodyMedium, color: colors.textMuted },
  emptyContainer: {
    flex: 1,
    paddingTop: 60,
  },
});
