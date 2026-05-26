import { useEffect, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Button } from "@hustl/ui";
import { colors, typography, spacing, radii, shadows } from "@/constants/theme";
import { useAuthStore } from "@/stores/auth";
import { useProfileStore } from "@/stores/profile";
import { profileApi, badgesApi, portfolioApi } from "@/lib/api";

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

export default function StudentProfileScreen() {
  const { user, logout } = useAuthStore();
  const { studentProfile, badges, setStudentProfile, setBadges } = useProfileStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [profileData, badgesData] = await Promise.all([
        profileApi.get(user.id),
        badgesApi.get(user.id),
      ]);
      if (profileData.studentProfile) {
        setStudentProfile(profileData.studentProfile);
      }
      setBadges(badgesData.badges);
    } catch {
      // Complete profile fallback
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const openStory = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveStoryIndex(index);
  };

  const initials = user?.name ? user.name.slice(0, 2).toUpperCase() : "HU";

  return (
    <Screen title="My Profile" subtitle="Your HUSTL worker identity.">
      {/* Profile Info Header */}
      <Card glow="lime">
        <View style={styles.headerRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileMeta}>
            <Text style={styles.name}>{user?.name ?? "Aarav Singh"}</Text>
            <Text style={styles.subtext}>
              {studentProfile?.collegeName ?? "Bangalore University"}
            </Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {user?.reputationScore?.toFixed(1) ?? "4.8"}</Text>
            </View>
          </View>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{user?.reputationScore?.toFixed(1) ?? "4.8"}</Text>
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>98%</Text>
            <Text style={styles.metricLabel}>Completion</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{studentProfile?.completedShifts ?? 23}</Text>
            <Text style={styles.metricLabel}>Jobs Done</Text>
          </View>
        </View>
      </Card>

      {/* About Me */}
      <Text style={styles.sectionTitle}>ABOUT ME</Text>
      <Card>
        <Text style={styles.aboutText}>
          Hardworking, punctual, and always deliver my best. Passionate about coffee crafting, video editing, and digital designs. Let's HUSTL! ⚡
        </Text>
      </Card>

      {/* Skills */}
      <Text style={styles.sectionTitle}>SKILLS</Text>
      <View style={styles.chipRow}>
        {(studentProfile?.skills?.length ? studentProfile.skills : ["Barista", "Cash Handling", "Customer Service", "Video Editing", "Photography"]).map((skill) => (
          <View key={skill} style={styles.chip}>
            <Text style={styles.chipText}>{skill}</Text>
          </View>
        ))}
      </View>

      {/* Badges */}
      <Text style={styles.sectionTitle}>MY BADGES</Text>
      <View style={styles.badgeGrid}>
        {(badges?.length ? badges : [
          { id: "b1", name: "Verified Barista", category: "Barista" },
          { id: "b2", name: "Weekend Warrior", category: "Gigs" },
          { id: "b3", name: "Fast Responder", category: "Ops" },
        ]).map((badge) => (
          <View key={badge.id} style={styles.badgeCard}>
            <Text style={styles.badgeIcon}>🏆</Text>
            <Text style={styles.badgeName}>{badge.name}</Text>
            <Text style={styles.badgeCategory}>{badge.category}</Text>
          </View>
        ))}
      </View>

      {/* Portfolio Story Mode */}
      <Text style={styles.sectionTitle}>PORTFOLIO WORK</Text>
      <View style={styles.portfolioGrid}>
        {mockPortfolio.map((item, index) => (
          <Pressable key={item.id} style={styles.portfolioCard} onPress={() => openStory(index)}>
            <Image source={{ uri: item.url }} style={styles.portfolioImage} />
            <View style={styles.portfolioOverlay}>
              <Text style={styles.portfolioTitle} numberOfLines={1}>{item.title}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button variant="secondary" onPress={() => {}}>
          Edit Profile
        </Button>
        <Button variant="danger" onPress={handleLogout}>
          Log Out
        </Button>
      </View>

      {/* Portfolio Story Viewer Modal */}
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
                <Text style={storyStyles.storySub}>Tap anywhere to close story</Text>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.base },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.amber, alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: colors.bg, fontSize: 24, fontWeight: "900" },
  profileMeta: { gap: 4 },
  name: { color: colors.textPrimary, ...typography.headingMedium },
  subtext: { color: colors.textMuted, fontSize: 13, fontWeight: "600" },
  ratingBadge: { backgroundColor: colors.amberGlow, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, alignSelf: "flex-start" },
  ratingText: { color: colors.amber, fontSize: 11, fontWeight: "700" },
  metricsRow: { flexDirection: "row", justifyContent: "space-around", marginTop: spacing.base, borderTopWidth: 1, borderColor: colors.border, paddingTop: spacing.base },
  metric: { alignItems: "center", gap: 2 },
  metricValue: { color: colors.textPrimary, ...typography.monoMedium, fontSize: 18 },
  metricLabel: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  sectionTitle: { color: colors.textMuted, ...typography.labelSmall, letterSpacing: 2, marginTop: spacing.lg, marginBottom: spacing.sm },
  aboutText: { color: colors.textSecondary, ...typography.bodyMedium, lineHeight: 22 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    backgroundColor: colors.glassMedium, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.borderLight,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  badgeCard: {
    backgroundColor: colors.card, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.borderAmber, padding: spacing.base, alignItems: "center",
    gap: spacing.xs, width: "30%",
  },
  badgeIcon: { fontSize: 28 },
  badgeName: { color: colors.textPrimary, fontSize: 11, fontWeight: "800", textAlign: "center" },
  badgeCategory: { color: colors.textMuted, fontSize: 9, fontWeight: "600" },
  portfolioGrid: { flexDirection: "row", gap: spacing.md, marginTop: spacing.xs },
  portfolioCard: { flex: 1, height: 120, borderRadius: radii.md, overflow: "hidden", borderWidth: 1, borderColor: colors.border, position: "relative" },
  portfolioImage: { width: "100%", height: "100%" },
  portfolioOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(10,9,20,0.85)", padding: 6 },
  portfolioTitle: { color: colors.textPrimary, fontSize: 11, fontWeight: "700" },
  actions: { gap: spacing.md, marginTop: spacing.xl },
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
