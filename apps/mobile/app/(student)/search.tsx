import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, SafeAreaView, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { X, Search, Sparkles, MapPin, Briefcase } from "lucide-react-native";
import { colors, typography, spacing, radii } from "@/constants/theme";
import { ActionBottomBar } from "@/components/ActionBottomBar";
import { Button } from "@hustl/ui";

export default function SearchScreen() {
  const router = useRouter();
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <X size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* AI Search Banner */}
        <Pressable style={styles.aiBanner}>
          <Sparkles size={20} color={colors.lime} />
          <View style={styles.aiBannerText}>
            <Text style={styles.aiTitle}>Try AI Search</Text>
            <Text style={styles.aiDesc}>"Find me evening shifts near Koramangala paying ₹300+"</Text>
          </View>
        </Pressable>

        {/* Inputs */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>What</Text>
          <View style={styles.inputBox}>
            <Briefcase size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Job title, keywords, or company"
              placeholderTextColor={colors.textMuted}
              value={what}
              onChangeText={setWhat}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Where</Text>
          <View style={styles.inputBox}>
            <MapPin size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="City, state, or zip code"
              placeholderTextColor={colors.textMuted}
              value={where}
              onChangeText={setWhere}
            />
          </View>
          <Pressable style={styles.currentLocBtn}>
            <Text style={styles.currentLocText}>Use current location</Text>
          </Pressable>
        </View>

      </ScrollView>

      <ActionBottomBar
        primaryLabel="Search Jobs"
        onPrimaryPress={() => router.back()}
        secondaryLabel="Clear"
        onSecondaryPress={() => { setWhat(""); setWhere(""); }}
        isPrimaryDisabled={!what && !where}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.textPrimary,
    ...typography.headingMedium,
  },
  scroll: {
    padding: spacing.lg,
  },
  aiBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderLime,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  aiBannerText: {
    flex: 1,
  },
  aiTitle: {
    color: colors.lime,
    ...typography.bodyMedium,
    fontWeight: "700",
  },
  aiDesc: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    marginTop: 2,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    color: colors.textPrimary,
    ...typography.headingSmall,
    marginBottom: spacing.md,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    height: 56,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    ...typography.bodyLarge,
  },
  currentLocBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  currentLocText: {
    color: colors.textLime,
    ...typography.bodyMedium,
    fontWeight: "600",
  },
});
