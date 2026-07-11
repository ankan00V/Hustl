import { useEffect, useRef } from "react";
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/theme";

interface ShimmerLoaderProps {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * ShimmerLoader - Premium shimmer loading animation
 * Creates a smooth shimmer effect for skeleton loading states
 */
export function ShimmerLoader({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: ShimmerLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.elevated,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            "transparent",
            "rgba(255, 255, 255, 0.03)",
            "rgba(255, 255, 255, 0.06)",
            "rgba(255, 255, 255, 0.03)",
            "transparent",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        />
      </Animated.View>
    </View>
  );
}

/**
 * ShimmerCard - Skeleton card for deck loading
 */
export function ShimmerCard() {
  return (
    <View style={styles.card}>
      {/* Hero section */}
      <ShimmerLoader width="100%" height={190} borderRadius={0} />

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Business row */}
        <View style={styles.bizRow}>
          <ShimmerLoader width={48} height={48} borderRadius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <ShimmerLoader width="70%" height={18} />
            <ShimmerLoader width="50%" height={14} />
          </View>
        </View>

        {/* Pay row */}
        <View style={{ marginTop: 20 }}>
          <ShimmerLoader width={120} height={32} />
        </View>

        {/* Time */}
        <View style={{ marginTop: 8 }}>
          <ShimmerLoader width={150} height={14} />
        </View>

        {/* Skills */}
        <View style={styles.skills}>
          <ShimmerLoader width={80} height={28} borderRadius={999} />
          <ShimmerLoader width={100} height={28} borderRadius={999} />
          <ShimmerLoader width={90} height={28} borderRadius={999} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  shimmer: {
    width: 300,
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 24,
  },
  cardContent: {
    padding: 24,
  },
  bizRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  skills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
});

// Made with Bob
