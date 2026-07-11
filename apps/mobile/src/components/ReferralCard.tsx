import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { referralsApi } from '@/lib/api';

export const ReferralCard = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [code, setCode] = useState<string>('HUSTL2026'); // Fallback mock code
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const response = await referralsApi.list();
      setReferrals(response.referrals || []);
      if (response.referrals && response.referrals.length > 0) {
        setCode(response.referrals[0].code);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join me on Hustl and get exclusive gigs! Use my referral code: ${code}\nhttps://hustl.app/invite/${code}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.lime} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift-outline" size={24} color={colors.lime} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Invite Friends & Earn</Text>
          <Text style={styles.subtitle}>Get profile boosts when they complete a shift</Text>
        </View>
      </View>

      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
        <View style={styles.codeRow}>
          <Text style={styles.code}>{code}</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={colors.bg} />
            <Text style={styles.shareButtonText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{referrals.length}</Text>
          <Text style={styles.statLabel}>Friends Joined</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statValue}>{referrals.filter(r => r.status === 'REDEEMED').length}</Text>
          <Text style={styles.statLabel}>Boosts Earned</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.limeGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.headingSmall,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 2,
  },
  codeContainer: {
    backgroundColor: colors.elevated,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  codeLabel: {
    ...typography.labelSmall,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    ...typography.monoLarge,
    color: colors.lime,
    letterSpacing: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lime,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    gap: spacing.xs,
  },
  shareButtonText: {
    ...typography.button,
    color: colors.bg,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.headingMedium,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
});
