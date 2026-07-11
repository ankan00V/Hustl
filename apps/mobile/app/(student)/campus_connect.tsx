import React from "react";
import { View, Text, StyleSheet, Pressable, SafeAreaView, FlatList, Image } from "react-native";
import { useRouter } from "expo-router";
import { X, MapPin, Users, Send } from "lucide-react-native";
import { colors, typography, spacing, radii } from "@/constants/theme";
import { EmptyState } from "@/components/EmptyState";
import { SegmentedControl } from "@/components/SegmentedControl";

const mockStudents = [
  { id: "1", name: "Sarah K.", role: "Barista @ Starbucks", distance: "0.2 miles away", initial: "SK" },
  { id: "2", name: "Rahul M.", role: "Event Staff @ TechPark", distance: "0.8 miles away", initial: "RM" },
  { id: "3", name: "Priya D.", role: "Retail @ Zara", distance: "1.2 miles away", initial: "PD" },
];

export default function CampusConnectScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState("Nearby");

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <X size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Campus Connect</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabsContainer}>
        <SegmentedControl
          options={["Nearby", "My Friends"]}
          selected={activeTab}
          onChange={setActiveTab}
        />
      </View>

      {activeTab === "My Friends" ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon={Users}
            title="Invite your friends"
            description="Add friends to see when they are working shifts and coordinate schedules."
            actionLabel="Invite Friends"
            onAction={() => {}}
          />
        </View>
      ) : (
        <FlatList
          data={mockStudents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.initial}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.role}>{item.role}</Text>
                <View style={styles.distanceRow}>
                  <MapPin size={12} color={colors.lime} />
                  <Text style={styles.distanceText}>{item.distance}</Text>
                </View>
              </View>
              <Pressable style={styles.messageBtn}>
                <Send size={18} color={colors.bg} />
              </Pressable>
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
  tabsContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: colors.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.bg,
    ...typography.headingSmall,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
    ...typography.bodyLarge,
    fontWeight: "700",
  },
  role: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    marginTop: 2,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  distanceText: {
    color: colors.lime,
    fontSize: 12,
    fontWeight: "600",
  },
  messageBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    paddingTop: 40,
  },
});
