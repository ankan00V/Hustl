import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  Zap,
  Search,
  Clock,
  SlidersHorizontal,
  X,
  Check,
  Info,
} from "lucide-react-native";
import * as Location from "expo-location";
import { Button } from "@hustl/ui";
import { colors, typography, spacing, radii } from "@/constants/theme";
import { useDeckStore, type Listing } from "@/stores/deck";
import { useAuthStore } from "@/stores/auth";
import { listingsApi, swipesApi } from "@/lib/api";
import { useRouter } from "expo-router";
import { ParticleSwipe } from "@/components/ParticleSwipe";
import { ConfettiCelebration } from "@/components/ConfettiCelebration";
import { ShimmerCard } from "@/components/ShimmerLoader";
import { appHaptics } from "@/lib/haptics";

// ─── Constants ────────────────────────────────────────────────────
const SWIPE_THRESHOLD = 100;
const SWIPE_OUT_DURATION = 280;
const ROTATION_FACTOR = 12; // max degrees of rotation

// ─── Category helpers ─────────────────────────────────────────────
function getCategoryMeta(title: string, category?: string) {
  const t = (title + " " + (category ?? "")).toLowerCase();
  if (
    t.includes("barista") ||
    t.includes("coffee") ||
    t.includes("cafe") ||
    t.includes("bistro") ||
    t.includes("food")
  )
    return { emoji: "☕", label: "Food & Beverage" };
  if (
    t.includes("event") ||
    t.includes("staff") ||
    t.includes("concert") ||
    t.includes("host") ||
    t.includes("promo")
  )
    return { emoji: "🎵", label: "Event & Music" };
  if (
    t.includes("retail") ||
    t.includes("assistant") ||
    t.includes("shop") ||
    t.includes("store")
  )
    return { emoji: "🛍️", label: "Retail & Fashion" };
  if (
    t.includes("office") ||
    t.includes("admin") ||
    t.includes("tech") ||
    t.includes("data")
  )
    return { emoji: "💻", label: "Office & Admin" };
  if (
    t.includes("delivery") ||
    t.includes("rider") ||
    t.includes("zepto")
  )
    return { emoji: "🛵", label: "Delivery & Logistics" };
  return { emoji: "⚡", label: "General Gig" };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

// ─── Next Card (static, behind) ───────────────────────────────────
function NextCard({ item, progress }: { item: Listing; progress: Animated.Value }) {
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
    extrapolate: "clamp",
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
    extrapolate: "clamp",
  });

  const meta = getCategoryMeta(item.title, item.businessCategory);

  return (
    <Animated.View
      style={[
        sStyles.cardOuter,
        { transform: [{ scale }, { translateY }], zIndex: 1 },
      ]}
    >
      <View style={sStyles.card}>
        <View style={sStyles.imagePlaceholder}>
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#161616" }]}
          />
          <View style={sStyles.visualContainer}>
            <Text style={sStyles.visualEmoji}>{meta.emoji}</Text>
            <Text style={sStyles.visualLabel}>{meta.label}</Text>
          </View>
        </View>
        <View style={sStyles.cardContent}>
          <View style={sStyles.bizRow}>
            <View style={sStyles.logo}>
              <Text style={sStyles.logoT}>
                {(item.businessName ?? "").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={sStyles.bizInfo}>
              <Text style={sStyles.jobTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={sStyles.bizName} numberOfLines={1}>
                {item.businessName}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Top (Swipeable) Card ─────────────────────────────────────────
function SwipeCard({
  item,
  pan,
  panHandlers,
  screenWidth,
}: {
  item: Listing;
  pan: Animated.ValueXY;
  panHandlers: ReturnType<typeof PanResponder.create>["panHandlers"];
  screenWidth: number;
}) {
  const meta = getCategoryMeta(item.title, item.businessCategory);

  const rotate = pan.x.interpolate({
    inputRange: [-screenWidth / 2, 0, screenWidth / 2],
    outputRange: [`-${ROTATION_FACTOR}deg`, "0deg", `${ROTATION_FACTOR}deg`],
    extrapolate: "clamp",
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-screenWidth / 3, -20],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const applyOpacity = pan.x.interpolate({
    inputRange: [20, screenWidth / 3],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      {...panHandlers}
      style={[
        sStyles.cardOuter,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate },
          ],
          zIndex: 10,
        },
      ]}
    >
      <View style={sStyles.card}>
        {/* SKIP Stamp */}
        <Animated.View
          style={[sStyles.stamp, sStyles.stampLeft, { opacity: nopeOpacity }]}
          pointerEvents="none"
        >
          <Text style={sStyles.nopeText}>SKIP</Text>
        </Animated.View>

        {/* APPLY Stamp */}
        <Animated.View
          style={[sStyles.stamp, sStyles.stampRight, { opacity: applyOpacity }]}
          pointerEvents="none"
        >
          <Text style={sStyles.applyText}>APPLY</Text>
        </Animated.View>

        {/* Hero */}
        <View style={sStyles.imagePlaceholder}>
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: "#161616" }]}
          />
          <View style={sStyles.visualContainer}>
            <Text style={sStyles.visualEmoji}>{meta.emoji}</Text>
            <Text style={sStyles.visualLabel}>{meta.label}</Text>
          </View>
          {item.isUrgent && (
            <View style={sStyles.urgentBadge}>
              <Zap size={11} color={colors.bg} fill={colors.bg} />
              <Text style={sStyles.urgentBadgeText}>URGENT</Text>
            </View>
          )}
          {/* Bottom gradient overlay */}
          <View
            style={[sStyles.heroBottomGradient, { backgroundColor: "transparent" }]}
            pointerEvents="none"
          />
        </View>

        {/* Content */}
        <View style={sStyles.cardContent}>
          <View style={sStyles.bizRow}>
            <View style={sStyles.logo}>
              <Text style={sStyles.logoT}>
                {(item.businessName ?? "").slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={sStyles.bizInfo}>
              <Text style={sStyles.jobTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={sStyles.bizName} numberOfLines={1}>
                {item.businessName}
                {item.distance
                  ? ` • ${(item.distance / 1000).toFixed(1)}km`
                  : " • Nearby"}
              </Text>
            </View>
          </View>

          <View style={sStyles.payRow}>
            <Text style={sStyles.payAmt}>₹{item.hourlyRate}</Text>
            <Text style={sStyles.payUnit}>/hr</Text>
            <View style={sStyles.payDot} />
            <Text style={sStyles.payUnit}>{item.totalHours} hrs</Text>
          </View>

          <Text style={sStyles.timeText}>
            {formatTime(item.startTime)} – {formatTime(item.endTime)}
          </Text>

          <View style={sStyles.skills}>
            {(item.skills ?? []).slice(0, 4).map((s) => (
              <View key={s} style={sStyles.chip}>
                <Text style={sStyles.chipT}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={sStyles.footer}>
          <Info size={14} color={colors.textMuted} />
          <Text style={sStyles.footerText}>Tap for details</Text>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main Deck Screen ──────────────────────────────────────────────
export default function DeckScreen() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const {
    listings,
    deckIndex,
    isDeckLoading,
    deckError,
    setListings,
    advanceDeck,
    setDeckLoading,
    setDeckError,
  } = useDeckStore();

  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState<any>(null);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Animated values
  const pan = useRef(new Animated.ValueXY()).current;
  // Progress: 0 = at rest, 1 = fully swiped
  const swipeProgress = useRef(new Animated.Value(0)).current;

  // Keep progress in sync with |pan.x| for next-card scale animation
  useEffect(() => {
    const id = pan.x.addListener(({ value }) => {
      const p = Math.min(Math.abs(value) / (screenWidth / 2), 1);
      swipeProgress.setValue(p);
    });
    return () => pan.x.removeListener(id);
  }, [pan.x, screenWidth, swipeProgress]);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setDeckLoading(true);
    setDeckError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 12.9352;
      let lng = 77.6245;
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      const data = await listingsApi.search({ lat, lng, radius: 5000 });
      setListings(data.listings as Listing[]);
    } catch (err: any) {
      setDeckError(err.message ?? "Failed to load listings");
    } finally {
      setDeckLoading(false);
    }
  };

  const resetCard = useCallback(() => {
    pan.setValue({ x: 0, y: 0 });
    swipeProgress.setValue(0);
    setSwiping(false);
  }, [pan, swipeProgress]);

  const handleSwipeComplete = useCallback(
    async (direction: "left" | "right") => {
      const card = listings[deckIndex];
      advanceDeck();
      resetCard();

      if (card && direction === "right") {
        try {
          const result = await swipesApi.swipe({
            listingId: card.id,
            direction: "RIGHT",
          });
          if (result.match) {
            appHaptics.deckMatch();
            setShowConfetti(true);
            setLastMatch({ ...result.match, listing: card });
            setTimeout(() => setShowMatchModal(true), 500);
          }
        } catch {
          // fail silently
        }
      }
    },
    [listings, deckIndex, advanceDeck, resetCard]
  );

  const swipeOut = useCallback(
    (direction: "left" | "right") => {
      if (swiping) return;
      setSwiping(true);

      const x =
        direction === "right" ? screenWidth + 150 : -screenWidth - 150;

      // Trigger particle animation
      setSwipeDirection(direction);

      // Haptic feedback
      if (direction === "right") {
        appHaptics.deckSwipeRight();
      } else {
        appHaptics.deckSwipeLeft();
      }

      Animated.parallel([
        Animated.timing(pan.x, {
          toValue: x,
          duration: SWIPE_OUT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(pan.y, {
          toValue: direction === "right" ? -40 : 40,
          duration: SWIPE_OUT_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(swipeProgress, {
          toValue: 1,
          duration: SWIPE_OUT_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => {
        handleSwipeComplete(direction);
      });
    },
    [swiping, screenWidth, pan, swipeProgress, handleSwipeComplete]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: (pan.x as any)._value, y: (pan.y as any)._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        if (gestureState.dx > SWIPE_THRESHOLD) {
          swipeOutRef.current("right");
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          swipeOutRef.current("left");
        } else {
          // Spring back
          Animated.parallel([
            Animated.spring(pan.x, {
              toValue: 0,
              useNativeDriver: true,
              damping: 15,
              stiffness: 150,
            }),
            Animated.spring(pan.y, {
              toValue: 0,
              useNativeDriver: true,
              damping: 15,
              stiffness: 150,
            }),
            Animated.timing(swipeProgress, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => setSwiping(false));
        }
      },
      onPanResponderTerminate: () => {
        pan.flattenOffset();
        resetCard();
      },
    })
  ).current;

  // Stable ref for swipeOut so PanResponder closure always calls latest version
  const swipeOutRef = useRef(swipeOut);
  useEffect(() => {
    swipeOutRef.current = swipeOut;
  }, [swipeOut]);

  const card = listings[deckIndex];
  const nextCard = listings[deckIndex + 1];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.creditsContainer}>
          <Zap size={13} color={colors.lime} fill={colors.lime} />
          <Text style={styles.creditsText}>12 / 15 Credits</Text>
        </View>
        <View style={styles.topBarActions}>
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              appHaptics.buttonPress();
              router.push("/skipped");
            }}
          >
            <Clock size={19} color={colors.textPrimary} />
          </Pressable>
          <Pressable
            style={styles.iconButton}
            onPress={() => {
              appHaptics.buttonPress();
              router.push("/filters");
            }}
          >
            <SlidersHorizontal size={19} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Search Trigger */}
      <Pressable
        style={styles.searchTrigger}
        onPress={() => {
          appHaptics.buttonPress();
          router.push("/search");
        }}
      >
        <Search size={17} color={colors.textMuted} />
        <Text style={styles.searchText}>Search roles, companies...</Text>
      </Pressable>

      {/* Deck */}
      <View style={styles.deckContainer}>
        {isDeckLoading ? (
          <ShimmerCard />
        ) : deckError ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>😕</Text>
            <Text style={styles.emptyTitle}>Something went wrong</Text>
            <Text style={styles.emptyDesc}>{deckError}</Text>
            <View style={{ marginTop: spacing.lg }}>
              <Button variant="secondary" onPress={loadListings}>
                Try Again
              </Button>
            </View>
          </View>
        ) : card ? (
          <>
            {/* Background card (next) */}
            {nextCard && (
              <NextCard item={nextCard} progress={swipeProgress} />
            )}

            {/* Top (swipeable) card */}
            <SwipeCard
              item={card}
              pan={pan}
              panHandlers={panResponder.panHandlers}
              screenWidth={screenWidth}
            />
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyDesc}>
              New shifts drop every hour. Check back soon.
            </Text>
            <View style={{ marginTop: spacing.lg }}>
              <Button
                onPress={() => {
                  appHaptics.refreshStart();
                  loadListings();
                }}
              >
                Refresh
              </Button>
            </View>
          </View>
        )}
      </View>

      {/* Bottom Action Buttons */}
      {card && (
        <View style={styles.bottomActions}>
          <Pressable
            style={styles.actionBtnSkip}
            onPress={() => {
              appHaptics.buttonPress();
              swipeOut("left");
            }}
            disabled={swiping}
          >
            <X size={26} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={styles.actionBtnApply}
            onPress={() => {
              appHaptics.buttonPress();
              swipeOut("right");
            }}
            disabled={swiping}
          >
            <Check size={30} color={colors.bg} />
          </Pressable>
        </View>
      )}

      {/* Particle Animation */}
      <ParticleSwipe
        direction={swipeDirection}
        onComplete={() => setSwipeDirection(null)}
      />

      {/* Confetti Celebration */}
      <ConfettiCelebration
        active={showConfetti}
        onComplete={() => setShowConfetti(false)}
      />

      {/* Match / Application Sent Modal */}
      {lastMatch && (
        <Modal visible={showMatchModal} transparent animationType="fade">
          <View style={mStyles.modalBg}>
            <View style={mStyles.modalContent}>
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: "transparent" }]}
              />
              <View style={mStyles.matchIconWrapper}>
                <Check size={38} color={colors.bg} />
              </View>
              <Text style={mStyles.matchTitle}>Application Sent! 🎉</Text>
              <Text style={mStyles.matchSubtitle}>
                <Text style={{ color: colors.lime }}>
                  {lastMatch.listing?.businessName}
                </Text>{" "}
                will review your profile shortly. Keep an eye on your inbox.
              </Text>
              <View style={mStyles.modalActions}>
                <Button size="large" onPress={() => setShowMatchModal(false)}>
                  Keep Swiping
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  creditsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    gap: 6,
  },
  creditsText: {
    color: colors.textPrimary,
    ...typography.bodySmall,
    fontWeight: "700",
  },
  topBarActions: { flexDirection: "row", gap: spacing.md },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    height: 46,
    borderRadius: radii.pill,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchText: {
    color: colors.textMuted,
    ...typography.bodyMedium,
  },
  deckContainer: {
    flex: 1,
    marginTop: spacing.lg,
    marginHorizontal: 14,
    position: "relative",
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  actionBtnSkip: {
    width: 64,
    height: 64,
    borderRadius: 0,
    backgroundColor: colors.card,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnApply: {
    width: 72,
    height: 72,
    borderRadius: 0,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxl,
  },
  emptyEmoji: { fontSize: 52, marginBottom: spacing.md },
  emptyTitle: {
    color: colors.textPrimary,
    ...typography.headingMedium,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    color: colors.textSecondary,
    ...typography.bodyMedium,
    textAlign: "center",
  },
});

const sStyles = StyleSheet.create({
  cardOuter: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  // Stamps
  stamp: {
    position: "absolute",
    zIndex: 100,
    top: 56,
  },
  stampLeft: {
    left: 28,
    transform: [{ rotate: "-12deg" }],
  },
  stampRight: {
    right: 28,
    transform: [{ rotate: "12deg" }],
  },
  nopeText: {
    color: colors.red,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 2,
    borderWidth: 4,
    borderColor: colors.red,
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(239, 68, 68, 0.12)",
  },
  applyText: {
    color: colors.lime,
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 2,
    borderWidth: 4,
    borderColor: colors.lime,
    borderRadius: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "rgba(200, 243, 58, 0.12)",
  },
  // Hero section
  imagePlaceholder: {
    height: 190,
    backgroundColor: colors.elevated,
    position: "relative",
  },
  heroBottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  urgentBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    backgroundColor: colors.lime,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    gap: 4,
    zIndex: 10,
  },
  urgentBadgeText: {
    color: colors.bg,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  visualContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  visualEmoji: { fontSize: 52 },
  visualLabel: {
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  // Card body
  cardContent: {
    padding: spacing.xl,
    flex: 1,
  },
  bizRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.elevated,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  logoT: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  bizInfo: { flex: 1 },
  jobTitle: {
    color: colors.textPrimary,
    ...typography.headingSmall,
  },
  bizName: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    marginTop: 2,
  },
  payRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: spacing.lg,
    gap: 4,
  },
  payAmt: {
    color: colors.lime,
    ...typography.displayMedium,
  },
  payUnit: {
    color: colors.textSecondary,
    ...typography.bodyMedium,
  },
  payDot: {
    width: 3,
    height: 3,
    borderRadius: 0,
    backgroundColor: colors.textMuted,
    marginBottom: 3,
    marginHorizontal: 2,
  },
  timeText: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    marginTop: spacing.xs,
  },
  skills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  chip: {
    backgroundColor: colors.elevated,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  chipT: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
});

const mStyles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(10, 10, 10, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    padding: spacing.xxl,
    alignItems: "center",
    width: "100%",
    overflow: "hidden",
  },
  matchIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 0,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  matchTitle: {
    color: colors.textPrimary,
    ...typography.headingLarge,
    textAlign: "center",
  },
  matchSubtitle: {
    color: colors.textSecondary,
    ...typography.bodyMedium,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  modalActions: {
    width: "100%",
    marginTop: spacing.xxl,
  },
});
