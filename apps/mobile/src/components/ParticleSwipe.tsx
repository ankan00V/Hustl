import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";

interface ParticleSwipeProps {
  direction: "left" | "right" | null;
  onComplete: () => void;
}

/**
 * ParticleSwipe - Premium particle animation on swipe
 * Creates floating particles that animate outward when user swipes
 */
export function ParticleSwipe({ direction, onComplete }: ParticleSwipeProps) {
  const particles = useRef(
    Array.from({ length: 12 }, () => ({
      opacity: new Animated.Value(0),
      translateX: new Animated.Value(0),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    if (!direction) return;

    const isRight = direction === "right";
    const baseColor = isRight ? colors.lime : colors.red;

    // Animate all particles
    const animations = particles.map((particle, index) => {
      const angle = (index / particles.length) * Math.PI * 2;
      const distance = 80 + Math.random() * 40;
      const targetX = Math.cos(angle) * distance * (isRight ? 1 : -1);
      const targetY = Math.sin(angle) * distance;

      return Animated.parallel([
        Animated.sequence([
          Animated.timing(particle.opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(particle.opacity, {
            toValue: 0,
            duration: 400,
            delay: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(particle.translateX, {
          toValue: targetX,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(particle.translateY, {
          toValue: targetY,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.spring(particle.scale, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 0,
            duration: 200,
            delay: 200,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      // Reset particles
      particles.forEach((p) => {
        p.opacity.setValue(0);
        p.translateX.setValue(0);
        p.translateY.setValue(0);
        p.scale.setValue(0);
      });
      onComplete();
    });
  }, [direction, particles, onComplete]);

  if (!direction) return null;

  const particleColor = direction === "right" ? colors.lime : colors.red;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: particleColor,
              opacity: particle.opacity,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  particle: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

// Made with Bob
