import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@hustl/ui";
import { colors, typography, spacing, radii, shadows } from "@/constants/theme";
import { useDeckStore, type Match } from "@/stores/deck";
import { matchesApi, checkInApi } from "@/lib/api";
import { ChatModal } from "@/components/ChatModal";

const TAB_MODES = ["Upcoming", "Completed", "Cancelled"];

const getMockMessages = (businessName: string) => [
  { id: "1", text: `Hey! Thanks for matching with ${businessName}. Looking forward to your shift.`, sender: "them" as const, time: "10:15 AM" },
  { id: "2", text: "Please make sure to wear clean, comfortable black clothing and arrive 10 minutes early for briefing.", sender: "them" as const, time: "10:16 AM" },
  { id: "3", text: "Got it! I will be there early. Excited to work with you guys.", sender: "me" as const, time: "10:20 AM" },
];

export default function MatchesScreen() {
  const { matches, isMatchesLoading, setMatches, setMatchesLoading, updateMatch } = useDeckStore();
  const [activeTab, setActiveTab] = useState("Upcoming");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const openChat = (match: Match) => {
    setSelectedMatch(match);
    setChatVisible(true);
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      const data = await matchesApi.list();
      setMatches(data.matches as Match[]);
    } catch (err: any) {
      // Silently fail - keep previous matches
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleCheckIn = async (match: Match) => {
    setCheckingIn(match.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required to check in.");
        setCheckingIn(null);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;

      const result = await checkInApi.arrive(match.id, lat, lng);
      
      // Update local state
      updateMatch(match.id, { status: "CHECKED_IN" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Checked In! 🎉", "Your shift has officially started. Work hard!");
      loadMatches();
    } catch (err: any) {
      Alert.alert("Check-in Failed", err.message ?? "Make sure you are within 200m of the business location.");
    } finally {
      setCheckingIn(null);
    }
  };

  const handleCheckOut = async (match: Match) => {
    setCheckingIn(match.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await checkInApi.checkout(match.id);
      
      const durationMin = Math.round(
        (new Date(match.listing.endTime).getTime() - new Date(match.listing.startTime).getTime()) /
          (1000 * 60)
      );
      await checkInApi.completeShift(match.id, durationMin);

      updateMatch(match.id, { status: "COMPLETED" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Shift Completed! 💸", `Earnings from ${match.listing.businessName} have been added to your Hustl Wallet.`);
      loadMatches();
    } catch (err: any) {
      Alert.alert("Checkout Failed", err.message ?? "Please try again.");
    } finally {
      setCheckingIn(null);
    }
  };

  // Filter matches based on selected tab
  const filteredMatches = matches.filter((m) => {
    if (activeTab === "Upcoming") {
      return ["PENDING", "ACCEPTED", "CHECKED_IN"].includes(m.status);
    } else if (activeTab === "Completed") {
      return m.status === "COMPLETED";
    } else {
      return ["CANCELLED", "NO_SHOW"].includes(m.status);
    }
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <Screen title="My Bookings" subtitle="Track your upcoming shifts and completed jobs.">
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {TAB_MODES.map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tabButton, activeTab === tab ? styles.tabActive : undefined]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : undefined]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {/* Loading state */}
      {isMatchesLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading bookings...</Text>
        </View>
      ) : filteredMatches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>No bookings here</Text>
          <Text style={styles.emptyText}>Swipes matches will show up here. Go match some shifts!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const initials = item.listing.businessName?.slice(0, 2).toUpperCase() ?? "TW";
            const dateStr = formatDate(item.listing.startTime);
            const isToday = dateStr === "Today";

            return (
              <View style={styles.bookingGroup}>
                <Text style={styles.dateHeader}>{dateStr}</Text>
                <Card glow={item.status === "COMPLETED" ? "green" : item.status === "CHECKED_IN" ? "lime" : undefined} style={styles.cardSpacing}>
                  <View style={styles.bookingRow}>
                    {/* Logo */}
                    <View style={styles.logoBox}>
                      <Text style={styles.logoText}>{initials}</Text>
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                      <Text style={styles.title}>{item.listing.title}</Text>
                      <Text style={styles.businessName}>{item.listing.businessName}</Text>
                      <View style={styles.timeBadge}>
                        <Text style={styles.timing}>
                          {formatTime(item.listing.startTime)} - {formatTime(item.listing.endTime)}
                        </Text>
                      </View>
                    </View>

                    {/* Pay Rate on the right */}
                    <View style={styles.rightCol}>
                      <Text style={styles.payAmount}>₹{item.listing.hourlyRate}</Text>
                      <Text style={styles.payHours}>
                        {Math.max(1, Math.round((new Date(item.listing.endTime).getTime() - new Date(item.listing.startTime).getTime()) / (1000 * 60 * 60)))}h shift
                      </Text>
                    </View>
                  </View>

                  {/* Actions based on status */}
                  <View style={styles.actionBtnRow}>
                    {item.status === "ACCEPTED" && (
                      <Button
                        style={styles.actionBtnRowItem}
                        disabled={checkingIn === item.id}
                        onPress={() => handleCheckIn(item)}
                      >
                        {checkingIn === item.id ? "Checking..." : "Check in →"}
                      </Button>
                    )}

                    {item.status === "CHECKED_IN" && (
                      <Button
                        variant="primary"
                        style={StyleSheet.flatten([styles.actionBtnRowItem, { backgroundColor: colors.amber }])}
                        disabled={checkingIn === item.id}
                        onPress={() => handleCheckOut(item)}
                      >
                        {checkingIn === item.id ? "Completing..." : "Complete ✓"}
                      </Button>
                    )}

                    {["ACCEPTED", "CHECKED_IN"].includes(item.status) && (
                      <Button
                        variant="secondary"
                        style={styles.chatBtn}
                        onPress={() => openChat(item)}
                      >
                        💬 Chat
                      </Button>
                    )}
                  </View>

                  {item.status === "PENDING" && (
                    <View style={styles.pendingStatus}>
                      <Text style={styles.pendingText}>⚡ Pending Business Confirmation</Text>
                    </View>
                  )}

                  {item.status === "COMPLETED" && (
                    <View style={styles.completedStatus}>
                      <Text style={styles.completedText}>✓ Shift Completed & Paid</Text>
                    </View>
                  )}
                </Card>
              </View>
            );
          }}
        />
      )}

      {selectedMatch && (
        <ChatModal
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          recipientName={selectedMatch.listing.businessName}
          jobTitle={selectedMatch.listing.title}
          recipientInitials={selectedMatch.listing.businessName?.slice(0, 2).toUpperCase() ?? "TW"}
          initialMessages={getMockMessages(selectedMatch.listing.businessName)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.base,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderRadius: radii.pill,
  },
  tabActive: {
    backgroundColor: colors.amber,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: colors.bg,
  },
  list: { gap: spacing.base },
  bookingGroup: { gap: spacing.sm },
  dateHeader: {
    color: colors.textMuted,
    ...typography.labelSmall,
    letterSpacing: 1.5,
    paddingLeft: spacing.xs,
  },
  bookingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.base,
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: "900",
  },
  info: { flex: 1, gap: 2 },
  title: {
    color: colors.textPrimary,
    ...typography.headingSmall,
    fontSize: 16,
  },
  businessName: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 4,
  },
  timeBadge: {
    backgroundColor: colors.elevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  timing: {
    color: colors.textPrimary,
    ...typography.monoSmall,
  },
  rightCol: { alignItems: "flex-end", gap: 2 },
  cardSpacing: { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
  payAmount: {
    color: colors.amber,
    ...typography.monoMedium,
    fontSize: 18,
  },
  payHours: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  actionBtnRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  actionBtnRowItem: {
    flex: 1.2,
  },
  chatBtn: {
    flex: 0.8,
  },
  pendingStatus: {
    marginTop: spacing.md,
    backgroundColor: colors.amberGlow,
    borderWidth: 1,
    borderColor: colors.borderAmber,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  pendingText: { color: colors.amber, fontSize: 12, fontWeight: "700" },
  completedStatus: {
    marginTop: spacing.md,
    backgroundColor: colors.greenGlow,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.25)",
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  completedText: { color: colors.green, fontSize: 12, fontWeight: "700" },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxxl },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.textPrimary, ...typography.headingMedium },
  emptyText: { color: colors.textMuted, ...typography.bodyMedium, textAlign: "center" },
});
