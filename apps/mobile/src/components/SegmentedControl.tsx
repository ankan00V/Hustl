import React, { useRef, useEffect } from "react";
import { View, Text, TouchableWithoutFeedback, Animated, StyleSheet, Dimensions } from "react-native";
import { colors, spacing, typography, radii } from "@/constants/theme";

interface SegmentedControlProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export function SegmentedControl({ options, selected, onChange }: SegmentedControlProps) {
  const selectedIndex = options.indexOf(selected);
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  
  const animatedValue = useRef(new Animated.Value(safeIndex)).current;
  const width = Dimensions.get("window").width - spacing.xl * 2;
  const segmentWidth = width / options.length;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: safeIndex,
      useNativeDriver: true,
      bounciness: 0,
      speed: 12,
    }).start();
  }, [safeIndex, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: options.map((_, i) => i),
    outputRange: options.map((_, i) => i * segmentWidth),
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.activeSegment,
          { width: segmentWidth, transform: [{ translateX }] },
        ]}
      />
      {options.map((option, index) => {
        const isActive = safeIndex === index;
        return (
          <TouchableWithoutFeedback key={option} onPress={() => onChange(option)}>
            <View style={styles.segment}>
              <Text
                style={[
                  styles.segmentText,
                  isActive && styles.activeSegmentText,
                ]}
              >
                {option}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 48,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 2,
    position: "relative",
  },
  segment: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  activeSegment: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 2,
    backgroundColor: colors.elevated,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderLight,
    zIndex: 0,
  },
  segmentText: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  activeSegmentText: {
    color: colors.textPrimary,
  },
});
