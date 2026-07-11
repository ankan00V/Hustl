import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame } from 'lucide-react-native';
import { colors, spacing, radii, typography } from '@/constants/theme';

interface StreakCounterProps {
  streak: number;
  maxStreak: number;
}

export function StreakCounter({ streak, maxStreak }: StreakCounterProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulse animation for active streaks
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [streak]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <View
        style={[styles.gradient, { backgroundColor: '#000000' }]}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.iconWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <Flame 
              size={24} 
              color={streak > 0 ? colors.amber : colors.textMuted} 
              fill={streak > 0 ? colors.amber : 'transparent'}
            />
          </Animated.View>
          
          <View style={styles.textContainer}>
            <Text style={styles.streakNumber}>{streak}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>

          {maxStreak > streak && (
            <View style={styles.maxBadge}>
              <Text style={styles.maxText}>Best: {maxStreak}</Text>
            </View>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.min((streak / 30) * 100, 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {streak < 30 ? `${30 - streak} days to 30-day milestone` : '🏆 30-day milestone reached!'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  gradient: {
    padding: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  glow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 0,
    backgroundColor: colors.amber,
    opacity: 0.3,
  },
  textContainer: {
    flex: 1,
  },
  streakNumber: {
    ...typography.headingLarge,
    color: colors.textPrimary,
  },
  streakLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  maxBadge: {
    backgroundColor: colors.elevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  maxText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '700',
  },
  progressContainer: {
    gap: spacing.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.elevated,
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amber,
    borderRadius: 0,
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    fontSize: 11,
  },
});

// Made with Bob
