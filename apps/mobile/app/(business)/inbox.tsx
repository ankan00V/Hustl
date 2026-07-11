import { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Button } from "@hustl/ui";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { colors, typography, spacing, radii, shadows } from "@/constants/theme";
import { matchesApi } from "@/lib/api";
import type { Match } from "@/stores/deck";
import { ChatModal } from "@/components/ChatModal";

interface PortfolioItem {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  title: string;
}

const mockPortfolio: PortfolioItem[] = [
  { id: "p1", url: "https://images.unsplash.com/photo-1507133750040-4a8f57021571?q=80&w=300&auto=format&fit=crop", type: "IMAGE", title: "Latte Art Practice" },
  { id: "p2", url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=300&auto=format&fit=crop", type: "IMAGE", title: "Video Editing Workspace" },
  { id: "p3", url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=300&auto=format&fit=crop", type: "IMAGE", title: "Logo Designs" },
];

const getMockMessagesForBusiness = (studentName: string) => [
  { id: "1", text: `Hey! Thanks for matching with us. Looking forward to your shift.`, sender: "me" as const, time: "10:15 AM" },
  { id: "2", text: "Please make sure to wear clean, comfortable black clothing and arrive 10 minutes early for briefing.", sender: "me" as const, time: "10:16 AM" },
  { id: "3", text: `Got it! I will be there early. Excited to work with ${studentName}.`, sender: "them" as const, time: "10:20 AM" },
];

export default function MatchInbox() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [activeStudentName, setActiveStudentName] = useState("");
  const [chatVisible, setChatVisible] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const openChat = (match: Match) => {
    setSelectedMatch(match);
    setChatVisible(true);
  };

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const data = await matchesApi.list();
      setMatches(data.matches as Match[]);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (matchId: string, status: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await matchesApi.updateStatus(matchId, status);
      setMatches((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, status: status as Match["status"] } : m))
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        status === "ACCEPTED" ? "Applicant Accepted! ✓" : "Decline Confirmed",
        status === "ACCEPTED" ? "The student has been notified and scheduled." : "Applicant declined."
      );
      loadInbox();
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Action failed");
    }
  };

  const openPortfolio = (studentName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveStudentName(studentName);
    setActiveStoryIndex(0);
  };

  const pendingMatches = matches.filter((m) => m.status === "PENDING");
  const activeMatches = matches.filter((m) => ["ACCEPTED", "CHECKED_IN", "COMPLETED"].includes(m.status));

  return (
    <Screen title="Match Inbox" subtitle="Review and hire interested students.">
      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading applicants...</Text>
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📥</Text>
          <Text style={styles.emptyTitle}>No applicants yet</Text>
          <Text style={styles.emptyText}>Students will appear here when they swipe right on your listings.</Text>
        </View>
      ) : (
        <>
          {pendingMatches.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>PENDING REVIEW ({pendingMatches.length})</Text>
              <View style={styles.list}>
                {pendingMatches.map((match) => {
                  const studentInitials = match.student?.name?.slice(0, 2).toUpperCase() ?? "ST";
                  return (
                    <Card key={match.id}>
                      <View style={styles.studentRow}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{studentInitials}</Text>
                        </View>
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{match.student?.name ?? "Student"}</Text>
                          <Text style={styles.studentMeta}>
                            ★ {match.student?.reputationScore?.toFixed(1) ?? "5.0"} ·{" "}
                            {match.student?.completedShifts ?? 12} shifts
                          </Text>
                          <Text style={styles.listingRef}>for: {match.listing.title}</Text>
                        </View>
                      </View>
                      
                      {/* Skills Row */}
                      <View style={styles.skillRow}>
                        {(match.student?.skills?.length ? match.student.skills : ["Barista", "POS", "Customer Service"]).map((skill) => (
                          <View key={skill} style={styles.chip}>
                            <Text style={styles.chipText}>{skill}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Portfolio Trigger */}
                      <Pressable style={styles.portfolioLink} onPress={() => openPortfolio(match.student?.name ?? "Student")}>
                        <Text style={styles.portfolioLinkText}>📸 View Story Portfolio →</Text>
                      </Pressable>

                      {/* Actions */}
                      <View style={styles.actionRow}>
                        <Button
                          variant="secondary"
                          size="small"
                          style={{ borderColor: colors.red, borderWidth: 1 }}
                          onPress={() => handleAction(match.id, "CANCELLED")}
                        >
                          <Text style={{ color: colors.red }}>Decline</Text>
                        </Button>
                        <Button size="small" onPress={() => handleAction(match.id, "ACCEPTED")}>
                          Accept & Hire
                        </Button>
                      </View>
                    </Card>
                  );
                })}
              </View>
            </>
          )}

          {activeMatches.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>HIRED & ACTIVE ({activeMatches.length})</Text>
              <View style={styles.list}>
                {activeMatches.map((match) => {
                  const studentInitials = match.student?.name?.slice(0, 2).toUpperCase() ?? "ST";
                  return (
                    <Card key={match.id} glow={match.status === "CHECKED_IN" ? "green" : "none"}>
                      <View style={styles.studentRow}>
                        <View style={[styles.avatar, match.status === "CHECKED_IN" ? styles.avatarActive : undefined]}>
                          <Text style={styles.avatarText}>{studentInitials}</Text>
                        </View>
                        <View style={styles.studentInfo}>
                          <Text style={styles.studentName}>{match.student?.name ?? "Student"}</Text>
                          <Text style={styles.studentMeta}>{match.listing.title}</Text>
                          
                          <View style={styles.statusBadgeRow}>
                            {match.status === "CHECKED_IN" && (
                              <View style={[styles.badge, styles.badgeActive]}>
                                <Text style={styles.badgeTextActive}>🟢 Checked In</Text>
                              </View>
                            )}
                            {match.status === "ACCEPTED" && (
                              <View style={[styles.badge, styles.badgeAccepted]}>
                                <Text style={styles.badgeTextAccepted}>✓ Scheduled</Text>
                              </View>
                            )}
                            {match.status === "COMPLETED" && (
                              <View style={[styles.badge, styles.badgeCompleted]}>
                                <Text style={styles.badgeTextCompleted}>✓ Completed</Text>
                              </View>
                            )}
                          </View>
                        </View>

                        {/* Chat button for hired matches */}
                        {["ACCEPTED", "CHECKED_IN"].includes(match.status) && (
                          <Pressable style={styles.chatIconBtn} onPress={() => openChat(match)}>
                            <Text style={styles.chatIconText}>💬</Text>
                          </Pressable>
                        )}
                      </View>
                    </Card>
                  );
                })}
              </View>
            </>
          )}
        </>
      )}

      {/* Student Portfolio Story Viewer Modal */}
      {activeStoryIndex !== null && (
        <Modal visible={activeStoryIndex !== null} transparent animationType="slide">
          <Pressable style={storyStyles.modalBg} onPress={() => setActiveStoryIndex(null)}>
            <View style={storyStyles.storyContainer}>
              {/* Progress bars at top */}
              <View style={storyStyles.progressRow}>
                {mockPortfolio.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      storyStyles.progressBar,
                      idx === activeStoryIndex ? storyStyles.progressBarActive : undefined,
                      idx < activeStoryIndex ? storyStyles.progressBarCompleted : undefined,
                    ]}
                  />
                ))}
              </View>

              {/* Main Image */}
              <Image source={{ uri: mockPortfolio[activeStoryIndex ?? 0]!.url }} style={storyStyles.storyImage} />
              
              {/* Bottom Card */}
              <View style={storyStyles.storyFooter}>
                <Text style={storyStyles.storyTitle}>{mockPortfolio[activeStoryIndex ?? 0]!.title}</Text>
                <Text style={storyStyles.storySub}>{activeStudentName}'s Portfolio · Tap anywhere to close</Text>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {selectedMatch && (
        <ChatModal
          visible={chatVisible}
          onClose={() => setChatVisible(false)}
          recipientName={selectedMatch.student?.name ?? "Student"}
          jobTitle={selectedMatch.listing.title}
          recipientInitials={selectedMatch.student?.name?.slice(0, 2).toUpperCase() ?? "ST"}
          initialMessages={getMockMessagesForBusiness(selectedMatch.student?.name ?? "Student")}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: colors.textMuted, ...typography.labelSmall, letterSpacing: 2, marginTop: spacing.lg, marginBottom: spacing.sm },
  list: { gap: spacing.md },
  studentRow: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.raised,
    alignItems: "center", justifyContent: "center",
  },
  avatarActive: { backgroundColor: colors.greenGlow, borderWidth: 1, borderColor: "rgba(34,197,94,0.3)" },
  avatarText: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  studentInfo: { flex: 1, gap: 2 },
  studentName: { color: colors.textPrimary, ...typography.headingSmall, fontSize: 16 },
  studentMeta: { color: colors.textMuted, ...typography.monoSmall },
  listingRef: { color: colors.amber, fontSize: 12, fontWeight: "700", marginTop: 2 },
  skillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    backgroundColor: colors.glassMedium, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  chipText: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },
  portfolioLink: { marginVertical: spacing.md, paddingVertical: spacing.xs },
  portfolioLinkText: { color: colors.purple, fontSize: 13, fontWeight: "800" },
  actionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.sm, justifyContent: "flex-end" },
  statusBadgeRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  badge: { borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 2 },
  badgeActive: { backgroundColor: colors.greenGlow },
  badgeTextActive: { color: colors.green, fontSize: 11, fontWeight: "800" },
  badgeAccepted: { backgroundColor: colors.amberGlow },
  badgeTextAccepted: { color: colors.amber, fontSize: 11, fontWeight: "800" },
  badgeCompleted: { backgroundColor: colors.glassMedium },
  badgeTextCompleted: { color: colors.textSecondary, fontSize: 11, fontWeight: "800" },
  empty: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xxxl },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { color: colors.textPrimary, ...typography.headingMedium },
  emptyText: { color: colors.textMuted, ...typography.bodyMedium, textAlign: "center" },
  chatIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glassMedium,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chatIconText: {
    fontSize: 16,
  },
});

const storyStyles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: "rgba(5, 5, 8, 0.98)", justifyContent: "center", alignItems: "center" },
  storyContainer: { width: "100%", height: "85%", justifyContent: "space-between", padding: spacing.xl, position: "relative" },
  progressRow: { flexDirection: "row", gap: 6, width: "100%", position: "absolute", top: spacing.md, left: spacing.xl },
  progressBar: { flex: 1, height: 3, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2 },
  progressBarActive: { backgroundColor: colors.amber },
  progressBarCompleted: { backgroundColor: colors.textSecondary },
  storyImage: { width: "100%", height: "70%", borderRadius: radii.xl, marginTop: spacing.xl, alignSelf: "center" },
  storyFooter: { alignItems: "center", gap: spacing.sm, marginBottom: spacing.xl },
  storyTitle: { color: colors.textPrimary, ...typography.headingLarge, textAlign: "center" },
  storySub: { color: colors.textMuted, fontSize: 12, fontWeight: "600" },
});
