import { View, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { useState } from 'react';
import { ChartBar, GearSix, CheckCircle } from 'phosphor-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import { usePremium } from '@/src/hooks/usePremium';
import { usePremiumStore } from '@/src/stores/premium';
import { PremiumBadge } from './PremiumBadge';
import { Card } from '@/src/components/ui/Card';
import { Text } from '@/src/components/ui/Text';
import { Button } from '@/src/components/ui/Button';

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

function GoldTopBorder() {
  return (
    <View style={styles.topBorderAccent}>
      <Svg width="100%" height={2}>
        <Defs>
          <LinearGradient id="paywallTopGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#f5d060" stopOpacity="1" />
            <Stop offset="1" stopColor="#c9a020" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height={2} fill="url(#paywallTopGrad)" />
      </Svg>
    </View>
  );
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
      <Card style={styles.card}>
        <GoldTopBorder />
        <View style={styles.headerRow}>
          <PremiumBadge size={20} />
          <Text preset="subheading" color={colors.primary}>{t('profile.premiumMember')}</Text>
        </View>

        {expiryText ? <Text preset="label" color={colors.textSecondary} style={styles.expiryText}>{expiryText}</Text> : null}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.push('/analytics' as any)}
        >
          <ChartBar size={18} color={colors.primary} weight="fill" />
          <Text preset="body" color={colors.primary} style={styles.linkText}>{t('premium.analyticsTitle')}</Text>
        </TouchableOpacity>

        {__DEV__ ? (
          <Button
            variant="destructive"
            label="Unsubscribe (Dev)"
            onPress={handleUnsubscribe}
            disabled={unsubscribing}
            loading={unsubscribing}
            size="sm"
            style={styles.devButton}
          />
        ) : (
          <TouchableOpacity style={styles.linkButton} onPress={openSubscriptionSettings}>
            <GearSix size={18} color={colors.textSecondary} weight="regular" />
            <Text preset="body" color={colors.textSecondary} style={styles.linkText}>{t('profile.settings')}</Text>
          </TouchableOpacity>
        )}
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <GoldTopBorder />
      <View style={styles.headerRow}>
        <PremiumBadge size={22} />
        <Text preset="subheading" color={colors.primary}>{t('profile.upgradeToPremium')}</Text>
      </View>

      <View style={styles.featureList}>
        {FEATURES.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <CheckCircle size={18} color={colors.primary} weight="fill" />
            <Text preset="body" style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>

      <Text preset="subheading" style={styles.price}>$4.99/month</Text>

      <Button
        variant="primary"
        label={t('profile.upgradeToPremium')}
        onPress={handlePurchase}
        disabled={purchasing || restoring}
        loading={purchasing}
        size="lg"
      />

      <TouchableOpacity
        style={styles.restoreLink}
        onPress={handleRestore}
        disabled={purchasing || restoring}
      >
        <Text preset="label" color={colors.textMuted}>
          {restoring ? t('common.loading') : t('common.retry')}
        </Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.primary + '40',
    width: '100%',
    marginBottom: spacing.lg,
  },
  topBorderAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  expiryText: {
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
    fontSize: 14,
  },
  price: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  restoreLink: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  linkText: {
    fontSize: 14,
  },
  devButton: {
    marginTop: spacing.sm,
  },
});
