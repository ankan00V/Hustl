import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, SafeAreaView, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Bell, Moon, Lock, HelpCircle, FileText, ChevronRight } from 'lucide-react-native';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { InAppNotification } from '@/components/InAppNotification';

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkEnabled, setDarkEnabled] = useState(true);
  const [toast, setToast] = useState<{ title: string; body: string; type: any } | null>(null);

  const togglePush = async (value: boolean) => {
    setPushEnabled(value);
    if (value) {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setToast({
          title: "Push Enabled",
          body: "You will now receive urgent shift alerts.",
          type: "success"
        });
      } else {
        setPushEnabled(false);
        setToast({
          title: "Permission Denied",
          body: "Please enable notifications in your phone settings.",
          type: "urgent"
        });
      }
    }
  };

  const SettingRow = ({ icon: Icon, title, isSwitch, switchValue, onSwitchChange, isLast }: any) => (
    <Pressable style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.rowLeft}>
        <View style={styles.iconBox}>
          <Icon size={20} color={colors.textPrimary} />
        </View>
        <Text style={styles.rowTitle}>{title}</Text>
      </View>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.elevated, true: colors.lime }}
          thumbColor={colors.bg}
        />
      ) : (
        <ChevronRight size={20} color={colors.textMuted} />
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <X size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Preferences */}
        <Text style={styles.sectionTitle}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow 
            icon={Bell} 
            title="Push Notifications" 
            isSwitch 
            switchValue={pushEnabled} 
            onSwitchChange={togglePush} 
          />
          <SettingRow 
            icon={Moon} 
            title="Dark Mode" 
            isSwitch 
            switchValue={darkEnabled} 
            onSwitchChange={setDarkEnabled} 
            isLast
          />
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <SettingRow icon={Lock} title="Privacy & Security" />
          <SettingRow icon={FileText} title="Tax Documents" isLast />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>SUPPORT</Text>
        <View style={styles.card}>
          <SettingRow icon={HelpCircle} title="Help Center" />
          <SettingRow icon={FileText} title="Terms of Service" isLast />
        </View>

        <View style={styles.versionRow}>
          <Text style={styles.versionText}>Hustl App v2.1.0</Text>
        </View>

      </ScrollView>

      {toast && (
        <InAppNotification 
          id="toast-push"
          {...toast}
          onDismiss={() => setToast(null)}
        />
      )}
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
    paddingBottom: spacing.xxxl,
  },
  sectionTitle: {
    color: colors.textSecondary,
    ...typography.bodySmall,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
    marginLeft: spacing.sm,
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    ...typography.bodyLarge,
    color: colors.textPrimary,
    fontWeight: "600",
  },
  versionRow: {
    alignItems: "center",
    marginTop: spacing.xxxl,
  },
  versionText: {
    color: colors.textMuted,
    ...typography.bodySmall,
  },
});
