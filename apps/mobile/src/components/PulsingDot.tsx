import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/theme';

interface PulsingDotProps {
  size?: number;
  color?: string;
  pulseScale?: number;
  duration?: number;
}

export function PulsingDot({
  size = 8,
  color = colors.lime,
  pulseScale = 2,
  duration = 1500,
}: PulsingDotProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: pulseScale,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulse.start();

    return () => pulse.stop();
  }, [scaleAnim, opacityAnim, pulseScale, duration]);

  return (
    <View style={[styles.container, { width: size * pulseScale, height: size * pulseScale }]}>
      {/* Pulsing ring */}
      <Animated.View
        style={[
          styles.pulse,
          {
            width: size * pulseScale,
            height: size * pulseScale,
            borderRadius: (size * pulseScale) / 2,
            borderColor: color,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      
      {/* Static dot */}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    borderWidth: 2,
  },
  dot: {
    position: 'absolute',
  },
});

// Made with Bob
