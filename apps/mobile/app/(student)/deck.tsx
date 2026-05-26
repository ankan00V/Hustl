import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { Button } from "@hustl/ui";
import { Screen } from "@/components/Screen";
import { colors, typography, spacing, radii, shadows } from "@/constants/theme";
import { useDeckStore, type Listing } from "@/stores/deck";
import { useAuthStore } from "@/stores/auth";
import { listingsApi, swipesApi } from "@/lib/api";

const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 300;

// Filter list
const filters = ["All", "Nearby", "Urgent ✨", "Pay ⌄", "Category ⌄", "Filters ⌄"];

// ─── Urgent Card ──────────────────────────────────────────
function UrgentCard({ item, onSelect }: { item: Listing; onSelect: () => void }) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Pressable style={uStyles.card} onPress={onSelect}>
      <View style={uStyles.cardTop}>
        <View style={uStyles.urgentTag}>
          <Text style={uStyles.urgentTagText}>🔴 URGENT</Text>
        </View>
        <Text style={uStyles.distanceTag}>
          📍 {item.distance ? (item.distance < 1000 ? `${item.distance}m` : `${(item.distance / 1000).toFixed(1)}km`) : "Nearby"}
        </Text>
      </View>
      
      <View style={uStyles.logoRow}>
        <View style={uStyles.logo}>
          <Text style={uStyles.logoText}>
            {(item.businessName ?? "").slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={uStyles.title} numberOfLines={1}>{item.title}</Text>
      <Text style={uStyles.business} numberOfLines={1}>{item.businessName}</Text>
      
      <View style={uStyles.payRow}>
        <Text style={uStyles.pay}>₹{item.hourlyRate}</Text>
        <Text style={uStyles.dot}>·</Text>
        <Text style={uStyles.duration}>{item.totalHours} hrs</Text>
      </View>
      
      <Text style={uStyles.time}>{formatTime(item.startTime)} - {formatTime(item.endTime)}</Text>
    </Pressable>
  );
}

// ─── Swipe Card ──────────────────────────────────────────
function CardHeroVisual({ category, title }: { category?: string; title: string }) {
  let gradColors: [string, string] = ['#2C1A4D', '#12072B']; // Dark Indigo
  let emoji = "⚡";
  let label = "General Gig";

  const t = (title + ' ' + (category ?? '')).toLowerCase();
  if (t.includes('barista') || t.includes('coffee') || t.includes('cafe') || t.includes('bistro') || t.includes('food')) {
    gradColors = ['#4A2E1B', '#1E1005']; // Coffee Brown
    emoji = "☕";
    label = "Food & Beverage";
  } else if (t.includes('event') || t.includes('staff') || t.includes('concert') || t.includes('host') || t.includes('promo')) {
    gradColors = ['#1E1B4B', '#090514']; // Deep Navy Purple
    emoji = "🎵";
    label = "Event & Music";
  } else if (t.includes('retail') || t.includes('assistant') || t.includes('shop') || t.includes('store') || t.includes('zudio') || t.includes('decathlon')) {
    gradColors = ['#064e3b', '#021812']; // Deep Forest Green
    emoji = "🛍️";
    label = "Retail & Fashion";
  } else if (t.includes('office') || t.includes('admin') || t.includes('tech') || t.includes('data')) {
    gradColors = ['#0F2D59', '#051226']; // Tech Blue
    emoji = "💻";
    label = "Office & Admin";
  } else if (t.includes('delivery') || t.includes('rider') || t.includes('zepto')) {
    gradColors = ['#6B21A8', '#3B0764']; // Purple Zepto
    emoji = "🛵";
    label = "Delivery & Logistics";
  }

  return (
    <LinearGradient colors={gradColors} style={StyleSheet.absoluteFillObject} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={sStyles.visualContainer}>
        <Text style={sStyles.visualEmoji}>{emoji}</Text>
        <Text style={sStyles.visualLabel}>{label}</Text>
      </View>
    </LinearGradient>
  );
}

function SwipeCard({
  item,
  isTop,
  translateX,
  translateY,
  screenWidth,
}: {
  item: Listing;
  isTop: boolean;
  translateX: Animated.SharedValue<number>;
  translateY: Animated.SharedValue<number>;
  screenWidth: number;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    if (!isTop) {
      const scale = interpolate(
        translateX.value,
        [-screenWidth / 2, 0, screenWidth / 2],
        [1, 0.93, 1],
        Extrapolate.CLAMP
      );
      return {
        transform: [{ scale }],
        zIndex: -1,
      };
    }

    const rotate = interpolate(
      translateX.value,
      [-screenWidth / 2, 0, screenWidth / 2],
      [-15, 0, 15],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  const nopeOpacity = useAnimatedStyle(() => {
    if (!isTop) return { opacity: 0 };
    const opacity = interpolate(
      translateX.value,
      [-screenWidth / 4, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const hustlOpacity = useAnimatedStyle(() => {
    if (!isTop) return { opacity: 0 };
    const opacity = interpolate(
      translateX.value,
      [0, screenWidth / 4],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity };
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDistance = (m?: number) => {
    if (!m) return "";
    return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
  };

  return (
    <Animated.View style={[sStyles.cardOuter, animatedStyle]}>
      {isTop && (
        <>
          <Animated.View style={[sStyles.stamp, sStyles.stampR, nopeOpacity]}>
            <Text style={sStyles.nopeText}>NOPE</Text>
          </Animated.View>
          <Animated.View style={[sStyles.stamp, sStyles.stampL, hustlOpacity]}>
            <Text style={sStyles.hustlText}>HUSTL!</Text>
          </Animated.View>
        </>
      )}
      <View style={[sStyles.card, item.isUrgent && sStyles.cardUrgent]}>
        <View style={sStyles.imagePlaceholder}>
          <CardHeroVisual category={item.businessCategory} title={item.title} />
          <View style={sStyles.imageTopBar}>
            {item.isUrgent && (
              <View style={sStyles.urgentBadgeImage}>
                <View style={sStyles.urgentPulse} />
                <Text style={sStyles.urgentBadgeImageText}>🔴 URGENT</Text>
              </View>
            )}
            {item.distance ? (
              <View style={sStyles.distBadgeImage}>
                <Text style={sStyles.distBadgeImageText}>📍 {formatDistance(item.distance)}</Text>
              </View>
            ) : <View />}
          </View>
        </View>

        <View style={sStyles.cardContent}>

        <View style={sStyles.bizRow}>
          <View style={[sStyles.logo, item.isUrgent && sStyles.logoUrg]}>
            <Text style={sStyles.logoT}>
              {(item.businessName ?? "").slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={sStyles.bizInfo}>
            <Text style={sStyles.bizName}>{item.businessName}</Text>
            <View style={sStyles.ratRow}>
              <Text style={sStyles.ratText}>★ {item.businessReputation?.toFixed(1) ?? "5.0"}</Text>
              {item.businessReputation >= 4.5 && (
                <Text style={sStyles.hiRat}>High Rating</Text>
              )}
              <Text style={sStyles.verBadge}>✓ Verified</Text>
            </View>
          </View>
          {item.isUrgent && (
            <View style={sStyles.urgBadge}>
              <Text style={sStyles.urgIcon}>⚡</Text>
              <Text style={sStyles.urgText}>Urgent</Text>
            </View>
          )}
        </View>

        <Text style={sStyles.jobTitle}>{item.title}</Text>
        <View style={sStyles.payRow}>
          <View style={sStyles.payBlock}>
            <Text style={sStyles.payAmt}>₹{item.hourlyRate}</Text>
            <Text style={sStyles.payUnit}>/hr</Text>
          </View>
          <View style={sStyles.dot} />
          <Text style={sStyles.dur}>{item.totalHours} hrs</Text>
        </View>

        <Text style={sStyles.timeText}>
          🕒 {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </Text>

        <View style={sStyles.skills}>
          {item.skills.map((s) => (
            <View key={s} style={sStyles.chip}>
              <Text style={sStyles.chipT}>{s}</Text>
            </View>
          ))}
        </View>

        <View style={sStyles.swipeHint}>
          <Text style={sStyles.hintT}>← Swipe to decide →</Text>
        </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Desktop Feed Card ──────────────────────────────────────────
function DesktopFeedCard({
  item,
  onHustl,
  onSkip,
}: {
  item: Listing;
  onHustl: () => void;
  onSkip: () => void;
}) {
  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDistance = (m?: number) => {
    if (!m) return "";
    return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
  };

  return (
    <View style={[fdStyles.card, item.isUrgent && fdStyles.cardUrgent]}>
      {/* Top row badges */}
      <View style={fdStyles.topRow}>
        <View style={fdStyles.leftRow}>
          <View style={fdStyles.catPill}>
            <Text style={fdStyles.catText}>{item.businessCategory ?? "Gig"}</Text>
          </View>
          {item.isUrgent && (
            <View style={fdStyles.urgBadge}>
              <Text style={fdStyles.urgText}>⚡ URGENT</Text>
            </View>
          )}
        </View>
        <View style={fdStyles.rightRow}>
          {item.distance ? <Text style={fdStyles.dist}>📍 {formatDistance(item.distance)}</Text> : null}
          <View style={fdStyles.verBadgeContainer}>
            <Text style={fdStyles.verBadge}>✓ Verified</Text>
          </View>
        </View>
      </View>

      {/* Main Info */}
      <View style={fdStyles.contentRow}>
        <View style={fdStyles.logo}>
          <Text style={fdStyles.logoText}>
            {(item.businessName ?? "").slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={fdStyles.mainInfo}>
          <Text style={fdStyles.jobTitle}>{item.title}</Text>
          <Text style={fdStyles.bizName}>{item.businessName}  ★ {item.businessReputation?.toFixed(1) ?? "5.0"}</Text>
        </View>

        {/* Pay Rate Block */}
        <View style={fdStyles.payBlock}>
          <Text style={fdStyles.payAmt}>₹{item.hourlyRate}</Text>
          <Text style={fdStyles.payUnit}>/hr ({item.totalHours} hrs)</Text>
        </View>
      </View>

      {/* Time & Skills */}
      <View style={fdStyles.footerRow}>
        <Text style={fdStyles.timeText}>
          🕒 {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </Text>
        <View style={fdStyles.skills}>
          {item.skills.map((s) => (
            <View key={s} style={fdStyles.chip}>
              <Text style={fdStyles.chipT}>{s}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={fdStyles.actions}>
        <Button variant="secondary" size="small" style={fdStyles.skipBtn} onPress={onSkip}>
          ✕ Skip
        </Button>
        <Button size="small" style={fdStyles.hustlBtn} onPress={onHustl}>
          Hustl Now ⚡
        </Button>
      </View>
    </View>
  );
}

// ─── Main Deck Screen ──────────────────────────────────────────
export default function DeckScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 900;
  
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

  const user = useAuthStore((s) => s.user);
  
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [lastMatch, setLastMatch] = useState<any>(null);
  
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setDeckLoading(true);
    setDeckError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 12.9352; // Default Koramangala
      let lng = 77.6245;

      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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

  const handleSwipeComplete = useCallback(async (direction: "left" | "right") => {
    const card = listings[deckIndex];
    advanceDeck();
    setSwiping(false);

    if (card) {
      try {
        const result = await swipesApi.swipe({
          listingId: card.id,
          direction: direction === "right" ? "RIGHT" : "LEFT",
        });

        if (result.match) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setLastMatch({
            ...result.match,
            listing: card,
          });
          setShowMatchModal(true);
        }
      } catch {
        // Swipe failures are non-blocking
      }
    }
  }, [listings, deckIndex]);

  const swipeOut = useCallback(
    (direction: "left" | "right") => {
      if (swiping) return;
      setSwiping(true);

      const x = direction === "right" ? screenWidth + 100 : -screenWidth - 100;

      if (direction === "right") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      translateX.value = withTiming(x, { duration: SWIPE_OUT_DURATION }, () => {
        runOnJS(handleSwipeComplete)(direction);
        translateX.value = 0;
        translateY.value = 0;
      });
    },
    [swiping, screenWidth, translateX, translateY, handleSwipeComplete]
  );

  const handleFeedAction = async (item: Listing, direction: "left" | "right") => {
    if (direction === "right") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    useDeckStore.setState({
      listings: listings.filter((l) => l.id !== item.id),
    });

    try {
      const result = await swipesApi.swipe({
        listingId: item.id,
        direction: direction === "right" ? "RIGHT" : "LEFT",
      });

      if (result.match) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLastMatch({
          ...result.match,
          listing: item,
        });
        setShowMatchModal(true);
      }
    } catch {
      // Swipe failures are non-blocking
    }
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD) {
        runOnJS(swipeOut)("right");
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(swipeOut)("left");
      } else {
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  // Filter listings
  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.businessName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (activeFilter === "All") return true;
    if (activeFilter === "Nearby") return (l.distance ?? 0) < 2000;
    if (activeFilter === "Urgent ✨") return !!l.isUrgent;
    if (activeFilter === "Pay ⌄") return parseFloat(l.hourlyRate) >= 200;
    return true;
  });

  const activeDeckIndex = deckIndex;
  const card = filteredListings[activeDeckIndex];
  const nextCard = filteredListings[activeDeckIndex + 1];
  const urgentList = filteredListings.filter((l) => l.isUrgent);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Purple Gradient Background */}
      <LinearGradient
        colors={['#1A0B2E', '#240B3E', '#0F0520']}
        locations={[0, 0.5, 1]}
        style={styles.gradientBg}
      />

      {/* Animated Glow Orbs */}
      <View style={[styles.glowOrb, styles.glowOrbPurple]} />
      <View style={[styles.glowOrb, styles.glowOrbBlue]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          {isDesktop ? (
            <View style={styles.heroHeader}>
              <Text style={styles.heroTitle}>
                Find gigs. Earn. <Text style={styles.heroAccent}>Hustl.</Text> Repeat.
              </Text>
              <Text style={styles.heroSub}>Swipe. Match. Work on your terms.</Text>
            </View>
          ) : (
            <View style={styles.mobileHeader}>
              <Text style={styles.greeting}>Hi, {user?.name?.split(" ")[0] ?? "Hustler"} 👋</Text>
              <Text style={styles.location}>📍 Koramangala, Bengaluru</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs, roles or companies..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((f) => (
            <Pressable
              key={f}
              style={[styles.filterPill, activeFilter === f ? styles.filterActive : undefined]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.filterText, activeFilter === f ? styles.filterTextActive : undefined]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Urgent List */}
        {urgentList.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Urgent near you</Text>
              <Pressable>
                <Text style={styles.viewAll}>View all →</Text>
              </Pressable>
            </View>
            <FlatList
              horizontal
              data={urgentList}
              keyExtractor={(i) => i.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.urgentList}
              renderItem={({ item }) => (
                <UrgentCard
                  item={item}
                  onSelect={() => {
                    const idx = filteredListings.findIndex((l) => l.id === item.id);
                    if (idx >= 0) useDeckStore.setState({ deckIndex: idx });
                  }}
                />
              )}
            />
          </>
        )}

        {/* Recommended swipe deck */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recommended for you</Text>
        </View>
        
        <View style={isDesktop ? styles.desktopListContainer : [styles.deckContainer, isDesktop ? styles.deckDesktop : undefined]}>
          {isDeckLoading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔄</Text>
              <Text style={styles.emptyTitle}>Loading shifts...</Text>
              <Text style={styles.emptyDesc}>Finding gigs near you</Text>
            </View>
          ) : deckError ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>⚠️</Text>
              <Text style={styles.emptyTitle}>Couldn't load shifts</Text>
              <Text style={styles.emptyDesc}>{deckError}</Text>
              <Button variant="secondary" onPress={loadListings}>
                Try again
              </Button>
            </View>
          ) : isDesktop ? (
            filteredListings.length > 0 ? (
              <View style={styles.desktopList}>
                {filteredListings.map((item) => (
                  <DesktopFeedCard
                    key={item.id}
                    item={item}
                    onHustl={() => handleFeedAction(item, "right")}
                    onSkip={() => handleFeedAction(item, "left")}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🎯</Text>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptyDesc}>New shifts drop every hour.</Text>
                <Button variant="secondary" onPress={loadListings}>
                  Refresh feed
                </Button>
              </View>
            )
          ) : card ? (
            <>
              {nextCard && <SwipeCard item={nextCard} isTop={false} translateX={translateX} translateY={translateY} screenWidth={screenWidth} />}
              <GestureDetector gesture={panGesture}>
                <Animated.View style={StyleSheet.absoluteFill}>
                  <SwipeCard item={card} isTop={true} translateX={translateX} translateY={translateY} screenWidth={screenWidth} />
                </Animated.View>
              </GestureDetector>
              
              <View style={styles.actions}>
                <Pressable style={styles.skipBtn} onPress={() => swipeOut("left")}>
                  <Text style={styles.skipIcon}>✕</Text>
                </Pressable>
                <Pressable style={styles.superBtn} onPress={() => swipeOut("right")}>
                  <Text style={styles.superIcon}>⚡</Text>
                </Pressable>
                <Pressable style={styles.likeBtn} onPress={() => swipeOut("right")}>
                  <Text style={styles.likeIcon}>♥</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🎯</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyDesc}>New shifts drop every hour.</Text>
              <Button variant="secondary" onPress={() => useDeckStore.setState({ deckIndex: 0 })}>
                Refresh deck
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Match Celebration Modal */}
      {lastMatch && (
        <Modal visible={showMatchModal} transparent animationType="fade">
          <View style={mStyles.modalBg}>
            <View style={mStyles.modalContent}>
              <Text style={mStyles.matchTitle}>It's a Match! 🎉</Text>
              <Text style={mStyles.matchSubtitle}>
                {lastMatch.listing?.businessName ?? "Business"} liked your profile.
              </Text>

              {/* Connected Avatars */}
              <View style={mStyles.avatarRow}>
                <View style={mStyles.avatarCircle}>
                  <Text style={mStyles.avatarText}>
                    {user?.name?.slice(0, 2).toUpperCase() ?? "ME"}
                  </Text>
                </View>
                <View style={mStyles.heartIcon}>
                  <Text style={{ fontSize: 24 }}>💖</Text>
                </View>
                <View style={[mStyles.avatarCircle, { backgroundColor: colors.amber }]}>
                  <Text style={[mStyles.avatarText, { color: colors.bg }]}>
                    {lastMatch.listing?.businessName?.slice(0, 2).toUpperCase() ?? "BIZ"}
                  </Text>
                </View>
              </View>

              {/* Badges */}
              <View style={mStyles.modalBadges}>
                <View style={mStyles.modalBadge}>
                  <Text style={mStyles.badgeLabel}>★ High Rating</Text>
                </View>
                <View style={mStyles.modalBadge}>
                  <Text style={mStyles.badgeLabel}>✓ Verified</Text>
                </View>
              </View>

              <View style={mStyles.modalActions}>
                <Button size="large" onPress={() => setShowMatchModal(false)}>
                  Send a Message
                </Button>
                <Button variant="secondary" size="large" onPress={() => setShowMatchModal(false)}>
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

// ─── Main styles ─────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  glowOrb: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.3,
    ...Platform.select({
      web: {
        filter: "blur(120px)",
      },
    }),
  },
  glowOrbPurple: {
    backgroundColor: "#9D4EDD",
    top: -150,
    right: -100,
  },
  glowOrbBlue: {
    backgroundColor: "#5B21B6",
    bottom: 200,
    left: -150,
  },
  scroll: { paddingBottom: spacing.xxxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  heroHeader: { gap: spacing.xs },
  heroTitle: { color: colors.textPrimary, ...typography.displayMedium, lineHeight: 44 },
  heroAccent: { color: colors.amber },
  heroSub: { color: colors.textSecondary, ...typography.bodyMedium },
  mobileHeader: { gap: 2 },
  greeting: { color: colors.textPrimary, ...typography.headingMedium },
  location: { color: colors.textMuted, ...typography.bodySmall },
  searchRow: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: spacing.sm,
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.base, height: 48,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14 },
  filterRow: { paddingHorizontal: spacing.lg, gap: spacing.sm, marginTop: spacing.md, paddingBottom: spacing.sm },
  filterPill: {
    backgroundColor: colors.card, borderRadius: radii.pill,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
  },
  filterActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: colors.bg, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  viewAll: { color: colors.amber, fontSize: 13, fontWeight: "700" },
  urgentList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  deckContainer: { height: 480, marginHorizontal: spacing.lg, position: "relative" },
  deckDesktop: { height: 500, maxWidth: 420, alignSelf: "center", width: "100%" },
  actions: { position: "absolute", bottom: 10, left: 0, right: 0, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: spacing.lg, zIndex: 5 },
  skipBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.glassMedium, borderWidth: 1, borderColor: colors.borderLight, alignItems: "center", justifyContent: "center" },
  skipIcon: { color: colors.red, fontSize: 20, fontWeight: "700" },
  superBtn: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center", ...shadows.glow },
  superIcon: { color: colors.bg, fontSize: 24, fontWeight: "900" },
  likeBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.glassMedium, borderWidth: 1, borderColor: colors.borderPurple, alignItems: "center", justifyContent: "center" },
  likeIcon: { color: colors.purple, fontSize: 20, fontWeight: "700" },
  desktopListContainer: { paddingHorizontal: spacing.lg, marginTop: spacing.md },
  desktopList: { gap: spacing.md },
  empty: { alignItems: "center", gap: spacing.base, paddingTop: 120, width: "100%", alignSelf: "center" },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { color: colors.textPrimary, ...typography.headingMedium },
  emptyDesc: { color: colors.textSecondary, ...typography.bodyMedium },
});

// ─── Urgent card styles ──────────────────────────────────
const uStyles = StyleSheet.create({
  card: {
    width: 200, backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, overflow: "hidden",
  },
  cardTop: {
    backgroundColor: "#1A0F0F", padding: spacing.sm,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  urgentTag: { backgroundColor: "rgba(239,68,68,0.15)", borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  urgentTagText: { color: colors.red, fontSize: 9, fontWeight: "800" },
  distanceTag: { color: colors.textMuted, fontSize: 10 },
  logoRow: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  logo: { width: 40, height: 40, borderRadius: radii.sm, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" },
  logoText: { color: colors.bg, fontSize: 14, fontWeight: "900" },
  title: { color: colors.textPrimary, fontSize: 14, fontWeight: "700", paddingHorizontal: spacing.md, marginTop: spacing.sm },
  business: { color: colors.textMuted, fontSize: 11, paddingHorizontal: spacing.md, marginTop: 2 },
  payRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, marginTop: spacing.sm },
  pay: { color: colors.amber, fontFamily: "monospace", fontSize: 16, fontWeight: "700" },
  dot: { color: colors.textMuted, fontSize: 10 },
  duration: { color: colors.textMuted, fontFamily: "monospace", fontSize: 12 },
  time: { color: colors.textMuted, fontSize: 10, paddingHorizontal: spacing.md, marginTop: 4, paddingBottom: spacing.sm },
});

// ─── Swipe card styles ───────────────────────────────────
const sStyles = StyleSheet.create({
  cardOuter: { ...StyleSheet.absoluteFillObject, justifyContent: "center", paddingHorizontal: spacing.xs },
  card: { backgroundColor: colors.card, borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.borderLight, padding: spacing.xl, gap: spacing.md, ...shadows.card },
  cardUrgent: { borderColor: "rgba(239,68,68,0.20)" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catPill: { backgroundColor: colors.purpleGlow, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: colors.borderPurple },
  catText: { color: colors.purple, fontSize: 11, fontWeight: "800" },
  dist: { color: colors.textMuted, ...typography.monoSmall },
  bizRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  logo: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: colors.amber, alignItems: "center", justifyContent: "center" },
  logoUrg: { backgroundColor: colors.red },
  logoT: { color: colors.bg, fontSize: 18, fontWeight: "900" },
  bizInfo: { flex: 1, gap: 3 },
  bizName: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  ratRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  ratText: { color: colors.amber, fontFamily: "monospace", fontSize: 13, fontWeight: "700" },
  hiRat: { color: colors.green, fontSize: 10, fontWeight: "800", backgroundColor: colors.greenGlow, borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2, overflow: "hidden" },
  verBadge: { color: colors.purple, fontSize: 10, fontWeight: "800", backgroundColor: colors.purpleGlow, borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2, overflow: "hidden" },
  urgBadge: { backgroundColor: colors.redGlow, borderRadius: radii.md, borderWidth: 1, borderColor: "rgba(239,68,68,0.25)", paddingHorizontal: spacing.md, paddingVertical: spacing.sm, alignItems: "center", gap: 2 },
  urgIcon: { fontSize: 16 },
  urgText: { color: colors.red, fontSize: 10, fontWeight: "900" },
  jobTitle: { color: colors.textPrimary, ...typography.headingLarge, marginTop: spacing.sm },
  payRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm },
  payBlock: { flexDirection: "row", alignItems: "baseline" },
  payAmt: { color: colors.amber, fontSize: 28, fontWeight: "800", fontFamily: "monospace" },
  payUnit: { color: colors.textMuted, fontSize: 16, fontWeight: "600" },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.textMuted },
  dur: { color: colors.textSecondary, ...typography.monoMedium },
  timeText: { color: colors.textSecondary, fontSize: 13, fontWeight: "500" },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  chip: { backgroundColor: colors.glassMedium, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.borderLight, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  chipT: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  swipeHint: { alignItems: "center", marginTop: spacing.md },
  hintT: { color: colors.textMuted, fontSize: 12, letterSpacing: 1 },
  stamp: { position: "absolute", zIndex: 10, padding: spacing.md },
  stampR: { top: 70, right: 30, transform: [{ rotate: "15deg" }] },
  stampL: { top: 70, left: 30, transform: [{ rotate: "-15deg" }] },
  nopeText: { color: colors.red, fontSize: 44, fontWeight: "900", letterSpacing: 3, borderWidth: 4, borderColor: colors.red, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, overflow: "hidden" },
  hustlText: { color: colors.green, fontSize: 44, fontWeight: "900", letterSpacing: 3, borderWidth: 4, borderColor: colors.green, borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, overflow: "hidden" },
  imagePlaceholder: { height: 180, backgroundColor: colors.elevated, borderRadius: radii.lg, marginBottom: spacing.md, position: "relative", overflow: "hidden" },
  imageTopBar: { position: "absolute", top: spacing.md, left: spacing.md, right: spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center", zIndex: 10 },
  urgentBadgeImage: { backgroundColor: colors.redGlow, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 },
  urgentPulse: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red },
  urgentBadgeImageText: { color: colors.red, fontSize: 10, fontWeight: "900" },
  distBadgeImage: { backgroundColor: colors.glassMedium, borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  distBadgeImageText: { color: colors.textSecondary, fontSize: 11, fontWeight: "600" },
  cardContent: { gap: spacing.sm },
  visualContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  visualEmoji: {
    fontSize: 54,
  },
  visualLabel: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
});

// ─── Match Celebration styles ─────────────────────────────
const mStyles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: "rgba(5, 5, 8, 0.95)", justifyContent: "center", alignItems: "center", padding: spacing.xl },
  modalContent: { backgroundColor: colors.surface, borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.borderAmber, padding: spacing.xxl, gap: spacing.lg, alignItems: "center", width: "100%", maxWidth: 360, ...shadows.elevated },
  matchTitle: { color: colors.amber, ...typography.displayMedium, textAlign: "center" },
  matchSubtitle: { color: colors.textSecondary, ...typography.bodyLarge, textAlign: "center", lineHeight: 24 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginVertical: spacing.md },
  avatarCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.purple, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.textPrimary },
  avatarText: { color: colors.textPrimary, fontSize: 22, fontWeight: "900" },
  heartIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, zIndex: 10 },
  modalBadges: { flexDirection: "row", gap: spacing.sm },
  modalBadge: { backgroundColor: colors.amberGlow, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  badgeLabel: { color: colors.amber, fontSize: 11, fontWeight: "700" },
  modalActions: { width: "100%", gap: spacing.md, marginTop: spacing.md },
});

const fdStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  cardUrgent: {
    borderColor: "rgba(239, 68, 68, 0.25)",
    backgroundColor: "#161014",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  catPill: {
    backgroundColor: colors.purpleGlow,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderPurple,
  },
  catText: {
    color: colors.purple,
    fontSize: 10,
    fontWeight: "800",
  },
  urgBadge: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  urgText: {
    color: colors.red,
    fontSize: 9,
    fontWeight: "900",
  },
  dist: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  verBadgeContainer: {
    backgroundColor: colors.purpleGlow,
    borderRadius: radii.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verBadge: {
    color: colors.purple,
    fontSize: 10,
    fontWeight: "800",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    backgroundColor: colors.amber,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.bg,
    fontSize: 16,
    fontWeight: "900",
  },
  mainInfo: {
    flex: 1,
    gap: 2,
  },
  jobTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
  },
  bizName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  payBlock: {
    alignItems: "flex-end",
  },
  payAmt: {
    color: colors.amber,
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "monospace",
  },
  payUnit: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  timeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
  },
  skills: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  chip: {
    backgroundColor: colors.glassMedium,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipT: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  skipBtn: {
    minWidth: 90,
  },
  hustlBtn: {
    minWidth: 120,
  },
});
