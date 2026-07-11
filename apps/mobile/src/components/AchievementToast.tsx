import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';

import { Trophy, Star, Zap, Award } from 'lucide-react-native';
import { colors, spacing, radii, typography } from '@/constants/theme';
import { appHaptics } from '@/lib/haptics';

interface AchievementToastProps {
  visible: boolean;
  title: string;
  description: string;
  type?: 'milestone' | 'streak' | 'rating' | 'special';
  onDismiss: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function AchievementToast({ 
  visible, 
  title, 
  description, 
  type = 'milestone',
  onDismiss 
}: AchievementToastProps) {
  const translateY = useRef(new Animated.Value(-200)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      appHaptics.achievementUnlocked();
      
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -200,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss());
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'milestone':
        return <Trophy size={28} color={colors.lime} fill={colors.lime} />;
      case 'streak':
        return <Zap size={28} color={colors.amber} fill={colors.amber} />;
      case 'rating':
        return <Star size={28} color={colors.lime} fill={colors.lime} />;
      case 'special':
        return <Award size={28} color={colors.lime} fill={colors.lime} />;
      default:
        return <Trophy size={28} color={colors.lime} fill={colors.lime} />;
    }
  };

  const getGradient = (): readonly [string, string] => {
    switch (type) {
      case 'streak':
        return ['rgba(245, 158, 11, 0.25)', 'rgba(245, 158, 11, 0.05)'] as const;
      case 'special':
        return ['rgba(157, 78, 221, 0.25)', 'rgba(157, 78, 221, 0.05)'] as const;
      default:
        return ['rgba(200, 243, 58, 0.25)', 'rgba(200, 243, 58, 0.05)'] as const;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }, { scale }],
          opacity,
        },
      ]}
    >
      <View style={[styles.gradient, { backgroundColor: colors.card }]}>
        <View style={styles.content}>
          <View style={styles.iconWrapper}>
            {getIcon()}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  gradient: {
    padding: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 0,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.borderLime,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
});

// Made with Bob
