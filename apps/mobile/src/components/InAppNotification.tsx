import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';

export interface ToastProps {
  id: string;
  title: string;
  body: string;
  type?: 'success' | 'info' | 'urgent';
  onPress?: () => void;
  onDismiss?: () => void;
}

export function InAppNotification({ title, body, type = 'info', onPress, onDismiss }: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 15, stiffness: 180, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      // Slide out
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start(() => onDismiss?.());
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'urgent': return 'warning';
      default: return 'information-circle';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success': return colors.lime;
      case 'urgent': return colors.red;
      default: return colors.purple;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.toast}>
        <View style={[styles.iconWrapper, { backgroundColor: getColor() }]}>
          <Ionicons name={getIcon() as any} size={20} color={colors.bg} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body} numberOfLines={2}>{body}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} style={styles.closeBtn}>
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    ...typography.label,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  body: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  closeBtn: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
