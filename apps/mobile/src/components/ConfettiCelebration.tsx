import { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { colors } from "@/constants/theme";

interface ConfettiCelebrationProps {
  active: boolean;
  onComplete?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * ConfettiCelebration - Premium confetti animation for match celebrations
 * Creates colorful confetti pieces that fall from top with physics
 */
export function ConfettiCelebration({ active, onComplete }: ConfettiCelebrationProps) {
  const confettiPieces = useRef(
    Array.from({ length: 50 }, () => {
      const startX = Math.random() * SCREEN_WIDTH;
      return {
        translateY: new Animated.Value(-100),
        translateX: new Animated.Value(startX),
        startX, // Store initial X position
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
      };
    })
  ).current;

  const confettiColors = [
    colors.lime,
    colors.purple,
    colors.amber,
    "#FF64B4",
    "#00B4FF",
    "#FFFFFF",
  ];

  useEffect(() => {
    if (!active) return;

    const animations = confettiPieces.map((piece, index) => {
      const delay = index * 20;
      const duration = 2000 + Math.random() * 1000;
      const endY = SCREEN_HEIGHT + 100;
      const drift = (Math.random() - 0.5) * 200;

      return Animated.parallel([
        Animated.sequence([
          Animated.timing(piece.opacity, {
            toValue: 1,
            duration: 200,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(piece.opacity, {
            toValue: 0,
            duration: 300,
            delay: duration - 500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(piece.translateY, {
          toValue: endY,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(piece.translateX, {
          toValue: piece.startX + drift,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.timing(piece.rotate, {
            toValue: 360,
            duration: 1000 + Math.random() * 500,
            useNativeDriver: true,
          })
        ),
        Animated.sequence([
          Animated.spring(piece.scale, {
            toValue: 0.8 + Math.random() * 0.4,
            friction: 3,
            tension: 40,
            delay,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      // Reset confetti
      confettiPieces.forEach((p) => {
        p.translateY.setValue(-100);
        p.translateX.setValue(Math.random() * SCREEN_WIDTH);
        p.rotate.setValue(0);
        p.opacity.setValue(0);
        p.scale.setValue(0);
      });
      onComplete?.();
    });
  }, [active, confettiPieces, onComplete]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.map((piece, index) => {
        const color = confettiColors[index % confettiColors.length];
        const shape = index % 3 === 0 ? "circle" : "rectangle";

        return (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              shape === "circle" ? styles.circle : styles.rectangle,
              {
                backgroundColor: color,
                opacity: piece.opacity,
                transform: [
                  { translateX: piece.translateX },
                  { translateY: piece.translateY },
                  {
                    rotate: piece.rotate.interpolate({
                      inputRange: [0, 360],
                      outputRange: ["0deg", "360deg"],
                    }),
                  },
                  { scale: piece.scale },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  confetti: {
    position: "absolute",
    width: 10,
    height: 10,
  },
  circle: {
    borderRadius: 5,
  },
  rectangle: {
    borderRadius: 2,
  },
});

// Made with Bob
