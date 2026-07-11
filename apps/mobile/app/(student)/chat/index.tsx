import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii, spacing, typography } from "@/constants/theme";
import { matchesApi } from "@/lib/api";

interface ConversationItem {
  id: string;
  listing: {
    title: string;
    businessName?: string;
  };
  status: string;
  lastMessage?: string;
  updatedAt?: string;
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: colors.textSecondary },
  ACCEPTED: { label: "Scheduled", color: colors.amber },
  CHECKED_IN: { label: "On Shift", color: colors.lime },
  COMPLETED: { label: "Done", color: colors.textMuted },
  CANCELLED: { label: "Cancelled", color: colors.red },
};

function timeAgo(dateStr?: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function InboxScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const data = await matchesApi.list();
      const accepted = (data.matches || []).filter((m: any) =>
        ["ACCEPTED", "CHECKED_IN", "COMPLETED"].includes(m.status)
      );
      setConversations(accepted as ConversationItem[]);
    } catch {
      // fallback mock
      setConversations([
        {
          id: "m1",
          listing: { title: "Evening Barista", businessName: "Third Wave Coffee" },
          status: "ACCEPTED",
          lastMessage: "Please arrive 10 min early for briefing.",
          updatedAt: new Date(Date.now() - 20 * 60000).toISOString(),
        },
        {
          id: "m2",
          listing: { title: "Weekend Event Staff", businessName: "The Social Hub" },
          status: "CHECKED_IN",
          lastMessage: "Great work today! See you tomorrow.",
          updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
        {
          id: "m3",
          listing: { title: "Retail Assistant", businessName: "Zara Indiranagar" },
          status: "COMPLETED",
          lastMessage: "Payment of ₹2,800 sent to your wallet.",
          updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadConversations();
  }, [loadConversations]);

  const renderItem = ({ item }: { item: ConversationItem }) => {
    const meta = STATUS_META[item.status] ?? STATUS_META["PENDING"]!;
    const initials = (item.listing.businessName ?? item.listing.title)
      .slice(0, 2)
      .toUpperCase();

    return (
      <Pressable
        style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
        onPress={() => router.push(`/(student)/chat/${item.id}` as any)}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
          {item.status === "CHECKED_IN" && <View style={styles.onlineIndicator} />}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.row}>
            <Text style={styles.businessName} numberOfLines={1}>
              {item.listing.businessName ?? item.listing.title}
            </Text>
            <Text style={styles.time}>{timeAgo(item.updatedAt)}</Text>
          </View>
          <Text style={styles.jobTitle} numberOfLines={1}>
            {item.listing.title}
          </Text>
          {item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
        </View>

        {/* Status pill */}
        <View style={[styles.statusPill, { borderColor: meta.color }]}>
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inbox</Text>
        <Ionicons name="create-outline" size={24} color={colors.textPrimary} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.lime} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubble-ellipses-outline" size={52} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptySubtitle}>
            When you match with a business and they accept, your chat will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.lime}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
  },
  title: { ...typography.headingLarge, color: colors.textPrimary },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  emptyTitle: { ...typography.headingMedium, color: colors.textPrimary },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  list: { paddingBottom: 100 },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 80,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  itemPressed: { backgroundColor: colors.elevated },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarText: { color: "#fff", fontSize: 18, fontWeight: "800" },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.lime,
    borderWidth: 2,
    borderColor: colors.bg,
  },

  content: { flex: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  businessName: { ...typography.bodyMedium, color: colors.textPrimary, fontWeight: "700", flex: 1 },
  time: { ...typography.bodySmall, color: colors.textMuted, fontSize: 11 },
  jobTitle: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: 2 },
  lastMessage: { ...typography.bodySmall, color: colors.textMuted, fontSize: 12 },

  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
});
