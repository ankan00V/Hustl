import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '@/constants/theme';
import { GradientButton } from '@/components/GradientButton';

interface WithdrawalSheetProps {
  visible: boolean;
  onClose: () => void;
  availableBalance: number;
}

export function WithdrawalSheet({ visible, onClose, availableBalance }: WithdrawalSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [amount, setAmount] = useState('');
  const [upiId, setUpiId] = useState('');

  const handleWithdraw = () => {
    if (step === 1) {
      setStep(2);
      setTimeout(() => {
        setStep(3);
      }, 2000);
    }
  };

  const handleClose = () => {
    setStep(1);
    setAmount('');
    setUpiId('');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.content}>
            {step === 1 && (
              <View>
                <Text style={styles.title}>Withdraw Funds</Text>
                <Text style={styles.subtitle}>Available: ₹{availableBalance.toFixed(2)}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Amount (₹)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    value={amount}
                    onChangeText={setAmount}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>UPI ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="user@upi"
                    placeholderTextColor={colors.textMuted}
                    value={upiId}
                    onChangeText={setUpiId}
                    autoCapitalize="none"
                  />
                </View>

                <GradientButton
                  title="Withdraw Now"
                  onPress={handleWithdraw}
                  disabled={!amount || !upiId || parseFloat(amount) > availableBalance}
                  style={styles.actionBtn}
                />
              </View>
            )}

            {step === 2 && (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={colors.lime} />
                <Text style={styles.processingTitle}>Processing...</Text>
                <Text style={styles.processingSubtitle}>Verifying your UPI details</Text>
              </View>
            )}

            {step === 3 && (
              <View style={styles.centerContent}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark" size={48} color={colors.bg} />
                </View>
                <Text style={styles.title}>Withdrawal Initiated!</Text>
                <Text style={styles.successSubtitle}>
                  ₹{amount} is on its way to {upiId}. It may take up to 24 hours to reflect in your account.
                </Text>
                <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
    minHeight: 400,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.headingMedium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.labelSmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.textPrimary,
    ...typography.bodyLarge,
  },
  actionBtn: {
    marginTop: spacing.md,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  processingTitle: {
    ...typography.headingSmall,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  processingSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.lime,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successSubtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  doneBtn: {
    backgroundColor: colors.elevated,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  doneBtnText: {
    color: colors.textPrimary,
    ...typography.label,
  },
});
