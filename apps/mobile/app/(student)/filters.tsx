import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { X, Check } from "lucide-react-native";
import { colors, typography, spacing, radii } from "@/constants/theme";
import { ActionBottomBar } from "@/components/ActionBottomBar";
import { SegmentedControl } from "@/components/SegmentedControl";

export default function FiltersScreen() {
  const router = useRouter();
  
  const [distance, setDistance] = useState("5 miles");
  const [shiftType, setShiftType] = useState("All");
  
  const distances = ["5 miles", "10 miles", "25 miles", "Anywhere"];
  const types = ["All", "Day", "Night", "Urgent"];

  return (
    <View style={styles.container}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filters</Text>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <X size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        <ScrollView style={styles.content}>
          
          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Distance</Text>
            <View style={styles.chipRow}>
              {distances.map((d) => (
                <Pressable
                  key={d}
                  style={[styles.chip, distance === d && styles.chipActive]}
                  onPress={() => setDistance(d)}
                >
                  <Text style={[styles.chipText, distance === d && styles.chipTextActive]}>
                    {d}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Shift Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shift Type</Text>
            <SegmentedControl
              options={types}
              selected={shiftType}
              onChange={setShiftType}
            />
          </View>

          {/* Verification */}
          <View style={styles.section}>
            <View style={styles.toggleRow}>
              <View>
                <Text style={styles.sectionTitle}>Verified Businesses Only</Text>
                <Text style={styles.sectionSubtitle}>Hide unverified listings</Text>
              </View>
              <Pressable style={styles.toggleActive}>
                <Check size={16} color={colors.bg} />
              </Pressable>
            </View>
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>

        <ActionBottomBar
          primaryLabel="Show 24 Shifts"
          onPrimaryPress={() => router.back()}
          secondaryLabel="Reset"
          onSecondaryPress={() => { setDistance("5 miles"); setShiftType("All"); }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    height: "85%",
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: "relative",
  },
  headerTitle: {
    color: colors.textPrimary,
    ...typography.headingMedium,
  },
  closeBtn: {
    position: "absolute",
    right: spacing.lg,
  },
  content: {
    padding: spacing.xl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.textPrimary,
    ...typography.headingSmall,
    marginBottom: spacing.md,
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    ...typography.bodySmall,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  chip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.lime,
    borderColor: colors.lime,
  },
  chipText: {
    color: colors.textPrimary,
    ...typography.bodyMedium,
    fontWeight: "600",
  },
  chipTextActive: {
    color: colors.bg,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleActive: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.lime,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
});
