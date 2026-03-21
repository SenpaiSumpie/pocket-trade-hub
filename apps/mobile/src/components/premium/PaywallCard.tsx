import { View, Text, TouchableOpacity, StyleSheet, Linking, Platform, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { ChartBar, GearSix, CheckCircle } from 'phosphor-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { usePremium } from '@/src/hooks/usePremium';
import { usePremiumStore } from '@/src/stores/premium';
import { PremiumBadge } from './PremiumBadge';

const FEATURES = [
  'Card demand analytics',
  'Priority match placement',
  'Advanced card alerts',
  'Premium badge',
];

function openSubscriptionSettings() {
  if (Platform.OS === 'ios') {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  } else if (Platform.OS === 'android') {
    Linking.openURL('https://play.google.com/store/account/subscriptions');
  }
}

export function PaywallCard() {
  const { t } = useTranslation();
  const { isPremium, purchase, restore } = usePremium();
  const premiumExpiresAt = usePremiumStore((s) => s.premiumExpiresAt);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [unsubscribing, setUnsubscribing] = useState(false);

  const handleUnsubscribe = async () => {
    setUnsubscribing(true);
    try {
      await purchase(); // dev-toggle flips off when already premium
    } finally {
      setUnsubscribing(false);
    }
  };

  const handlePurchase = async () => {
    setPurchasing(true);
    try {
      await purchase();
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      await restore();
    } finally {
      setRestoring(false);
    }
  };

  if (isPremium) {
    const expiryText = premiumExpiresAt
      ? t('profile.premiumExpires', { date: new Date(premiumExpiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) })
      : '';

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <PremiumBadge size={20} />
          <Text style={styles.activeTitle}>{t('profile.premiumMember')}</Text>
        </View>

        {expiryText ? <Text style={styles.expiryText}>{expiryText}</Text> : null}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/analytics' as any)}
        >
          <ChartBar size={18} color={colors.primary} weight="fill" />
          <Text style={styles.linkText}>{t('premium.analyticsTitle')}</Text>
        </TouchableOpacity>

        {__DEV__ ? (
          <TouchableOpacity
            style={[styles.unsubscribeButton, unsubscribing && styles.buttonDisabled]}
            onPress={handleUnsubscribe}
            disabled={unsubscribing}
          >
            {unsubscribing ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Text style={styles.unsubscribeText}>Unsubscribe (Dev)</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.linkButton} onPress={openSubscriptionSettings}>
            <GearSix size={18} color={colors.textSecondary} weight="regular" />
            <Text style={[styles.linkText, { color: colors.textSecondary }]}>{t('profile.settings')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <PremiumBadge size={22} />
        <Text style={styles.title}>{t('profile.upgradeToPremium')}</Text>
      </View>

      <View style={styles.featureList}>
        {FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <CheckCircle size={18} color={colors.primary} weight="fill" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.price}>$4.99/month</Text>

      <TouchableOpacity
        style={[styles.subscribeButton, purchasing && styles.buttonDisabled]}
        onPress={handlePurchase}
        disabled={purchasing || restoring}
      >
        {purchasing ? (
          <ActivityIndicator size="small" color={colors.background} />
        ) : (
          <Text style={styles.subscribeText}>{t('profile.upgradeToPremium')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.restoreLink}
        onPress={handleRestore}
        disabled={purchasing || restoring}
      >
        <Text style={styles.restoreLinkText}>
          {restoring ? t('common.loading') : t('common.retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    padding: spacing.lg,
    width: '100%',
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subheading,
    color: colors.primary,
  },
  activeTitle: {
    ...typography.subheading,
    color: colors.primary,
  },
  expiryText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  featureList: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    ...typography.body,
    color: colors.text,
    fontSize: 14,
  },
  price: {
    ...typography.subheading,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  subscribeText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  restoreLink: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  restoreLinkText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  linkText: {
    ...typography.body,
    color: colors.primary,
    fontSize: 14,
  },
  unsubscribeButton: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  unsubscribeText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
