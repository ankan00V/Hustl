import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp } from 'lucide-react-native';
import { colors, spacing, radii, typography } from '@/constants/theme';

interface LevelProgressBarProps {
  currentLevel: number;
  currentXP: number;
  xpForNextLevel: number;
  animated?: boolean;
}

export function LevelProgressBar({
  currentLevel,
  currentXP,
  xpForNextLevel,
  animated = true,
}: LevelProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progress = Math.min((currentXP / xpForNextLevel) * 100, 100);

  useEffect(() => {
    if (animated) {
      Animated.spring(progressAnim, {
        toValue: progress,
        tension: 20,
        friction: 7,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.setValue(progress);
    }
  }, [progress, animated]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <TrendingUp size={16} color={colors.bg} />
          <Text style={styles.levelText}>Level {currentLevel}</Text>
        </View>
        <Text style={styles.xpText}>
          {currentXP.toLocaleString()} / {xpForNextLevel.toLocaleString()} XP
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFillWrapper, { width: progressWidth }]}>
            <LinearGradient
              colors={[colors.lime, colors.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.progressFill}
            />
          </Animated.View>
        </View>
      </View>

      {/* Next Level Info */}
      <Text style={styles.nextLevelText}>
        {xpForNextLevel - currentXP} XP to Level {currentLevel + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.lime,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  levelText: {
    color: colors.bg,
    ...typography.bodySmall,
    fontWeight: '800',
  },
  xpText: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 8,
    backgroundColor: colors.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillWrapper: {
    height: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  nextLevelText: {
    color: colors.textMuted,
    ...typography.bodySmall,
    fontSize: 11,
    textAlign: 'center',
  },
});

// Made with Bob
