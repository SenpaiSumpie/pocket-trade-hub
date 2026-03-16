import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { usePromoStore } from '@/src/stores/promo';

export default function RedeemCodeForm() {
  const [code, setCode] = useState('');
  const redeeming = usePromoStore((s) => s.redeeming);
  const lastResult = usePromoStore((s) => s.lastResult);
  const error = usePromoStore((s) => s.error);
  const redeemCode = usePromoStore((s) => s.redeemCode);
  const clearResult = usePromoStore((s) => s.clearResult);

  const handleCodeChange = (text: string) => {
    setCode(text);
    if (lastResult || error) {
      clearResult();
    }
  };

  const handleRedeem = () => {
    if (!code.trim() || redeeming) return;
    redeemCode(code.trim());
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Redeem Code</Text>
      <View style={styles.divider} />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={handleCodeChange}
          placeholder="Enter promo code"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          maxLength={30}
          editable={!redeeming}
        />
        <TouchableOpacity
          style={[styles.redeemButton, (!code.trim() || redeeming) && styles.redeemButtonDisabled]}
          onPress={handleRedeem}
          disabled={!code.trim() || redeeming}
          activeOpacity={0.7}
        >
          {redeeming ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Ionicons name="gift-outline" size={18} color={colors.background} />
              <Text style={styles.redeemButtonText}>Redeem</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {lastResult && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={styles.successText}>
            {lastResult.premiumDays} days of premium added! Expires: {formatDate(lastResult.newExpiresAt)}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 16,
    letterSpacing: 1,
  },
  redeemButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  redeemButtonDisabled: {
    opacity: 0.5,
  },
  redeemButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
    borderRadius: borderRadius.sm,
  },
  successText: {
    ...typography.caption,
    color: colors.success,
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.error,
    flex: 1,
  },
});
