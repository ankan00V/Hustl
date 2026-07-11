import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";
import { Button } from "@hustl/ui";
import { Screen } from "@/components/Screen";
import { Card } from "@/components/Card";
import { Field } from "@/components/Field";
import { colors, typography, spacing, radii } from "@/constants/theme";
import { listingsApi } from "@/lib/api";

export default function PostListingScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [totalHours, setTotalHours] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handlePost = async () => {
    if (!title || !hourlyRate || !totalHours) {
      Alert.alert("Missing fields", "Title, hourly rate, and duration are required.");
      return;
    }

    setSubmitting(true);
    try {
      const now = new Date();
      const start = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h from now
      const hours = parseFloat(totalHours) || 3;
      const end = new Date(start.getTime() + hours * 60 * 60 * 1000);

      await listingsApi.create({
        title,
        description,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
        hourlyRate: parseFloat(hourlyRate),
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        isUrgent: urgent,
        lat: 12.9352,
        lng: 77.6245,
      });

      Alert.alert("Posted!", "Your listing is now live in student decks.");
      // Reset form
      setTitle("");
      setDescription("");
      setSkills("");
      setHourlyRate("");
      setTotalHours("");
      setUrgent(false);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "Failed to post listing");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen title="Post a Shift" subtitle="Fill shifts fast. Students swipe in minutes.">
      <Field label="SHIFT TITLE" placeholder="e.g. Evening Barista" value={title} onChangeText={setTitle} />
      <Field
        label="DESCRIPTION"
        placeholder="What the shift involves..."
        multiline
        value={description}
        onChangeText={setDescription}
      />
      <Field
        label="SKILLS NEEDED"
        placeholder="Coffee, POS, Hindi (comma-separated)"
        value={skills}
        onChangeText={setSkills}
      />

      <View style={styles.row}>
        <View style={styles.half}>
          <Field label="RATE (₹/HR)" placeholder="200" prefix="₹" mono value={hourlyRate} onChangeText={setHourlyRate} />
        </View>
        <View style={styles.half}>
          <Field label="DURATION (HRS)" placeholder="4" mono value={totalHours} onChangeText={setTotalHours} />
        </View>
      </View>

      <Card glow="lime">
        <View style={styles.urgentRow}>
          <View style={styles.urgentInfo}>
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentLabel}>⚡ URGENT HIRING</Text>
            </View>
            <Text style={styles.urgentHint}>Push instant alerts to students nearby for immediate fulfillment</Text>
          </View>
          <Switch
            value={urgent}
            onValueChange={setUrgent}
            trackColor={{ false: colors.elevated, true: colors.amberGlow }}
            thumbColor={urgent ? colors.amber : colors.textMuted}
            style={styles.switch}
          />
        </View>
      </Card>

      <Button size="large" onPress={handlePost} disabled={submitting} style={styles.submitBtn}>
        {submitting ? "Posting..." : "Post Shift to Decks →"}
      </Button>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.md },
  half: { flex: 1 },
  urgentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  urgentInfo: { flex: 1, gap: 4, paddingRight: spacing.md },
  urgentBadge: { alignSelf: "flex-start", backgroundColor: "rgba(255, 69, 58, 0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: "rgba(255, 69, 58, 0.3)" },
  urgentLabel: { color: colors.red, fontWeight: "900", fontSize: 12, letterSpacing: 1 },
  urgentHint: { color: colors.textMuted, ...typography.bodySmall, lineHeight: 18 },
  switch: { transform: [{ scale: 0.9 }] },
  submitBtn: { marginTop: spacing.md, backgroundColor: colors.lime, borderRadius: radii.lg, paddingVertical: spacing.lg },
});
