import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, DimensionValue, Animated } from 'react-native';
import { colors, radii, spacing } from '@/constants/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 20, borderRadius = radii.sm, style }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
        { opacity },
      ]}
    />
  );
};

export const SkeletonList = ({ count = 3 }) => {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.item}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={styles.content}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="40%" height={14} style={{ marginTop: 8 }} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    padding: spacing.base,
    gap: spacing.base,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    flex: 1,
  },
  skeleton: {
    backgroundColor: colors.elevated,
  },
});
