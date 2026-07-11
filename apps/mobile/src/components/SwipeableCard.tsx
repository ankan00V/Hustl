import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Dimensions } from 'react-native';
import { colors } from '@/constants/theme';

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 120;

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  threshold = SWIPE_THRESHOLD,
}: SwipeableCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
        rotate.setValue(gesture.dx / 10);
      },
      onPanResponderRelease: (_, gesture) => {
        pan.flattenOffset();

        if (gesture.dx > threshold) {
          // Swipe right
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: SCREEN_WIDTH + 100,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: 20,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeRight?.();
            resetPosition();
          });
        } else if (gesture.dx < -threshold) {
          // Swipe left
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: -SCREEN_WIDTH - 100,
              duration: 250,
              useNativeDriver: true,
            }),
            Animated.timing(rotate, {
              toValue: -20,
              duration: 250,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeLeft?.();
            resetPosition();
          });
        } else {
          // Return to center
          Animated.parallel([
            Animated.spring(pan, {
              toValue: { x: 0, y: 0 },
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.spring(rotate, {
              toValue: 0,
              friction: 5,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    pan.setValue({ x: 0, y: 0 });
    rotate.setValue(0);
  };

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-20, 0, 20],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  const animatedCardStyle = {
    transform: [
      { translateX: pan.x },
      { translateY: pan.y },
      { rotate: rotateInterpolate },
    ],
  };

  return (
    <Animated.View
      style={[styles.card, animatedCardStyle]}
      {...panResponder.panHandlers}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
});

// Made with Bob
