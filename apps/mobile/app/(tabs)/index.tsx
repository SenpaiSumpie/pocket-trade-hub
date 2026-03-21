import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, GitBranch, PaperPlaneTilt, ChartBar, CaretRight } from 'phosphor-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/src/stores/auth';
import SetupChecklist from '@/src/components/SetupChecklist';
import CollectionSummary from '@/src/components/cards/CollectionSummary';
import { LockedFeatureCard } from '@/src/components/premium/LockedFeatureCard';
import { SmartTradesSection } from '@/src/components/suggestions/SmartTradesSection';
import { usePremiumStore } from '@/src/stores/premium';
import { useSuggestionsStore } from '@/src/stores/suggestions';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

import type { Icon as PhosphorIcon } from 'phosphor-react-native';

interface PreviewCard {
  Icon: PhosphorIcon;
  titleKey: string;
  descKey: string;
  color: string;
}

const PREVIEWS: PreviewCard[] = [
  {
    Icon: Stack,
    titleKey: 'home.cardsDatabase',
    descKey: 'home.cardsDatabaseDesc',
    color: '#3498db',
  },
  {
    Icon: GitBranch,
    titleKey: 'home.tradeMatching',
    descKey: 'home.tradeMatchingDesc',
    color: '#2ecc71',
  },
  {
    Icon: PaperPlaneTilt,
    titleKey: 'home.tradeProposals',
    descKey: 'home.tradeProposalsDesc',
    color: '#e74c3c',
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const displayName = user?.displayName || 'Trainer';
  const isPremium = usePremiumStore((s) => s.isPremium);
  const fetchSuggestions = useSuggestionsStore((s) => s.fetchSuggestions);

  // Fetch suggestions when Home tab gains focus
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        fetchSuggestions();
      }
    }, [isLoggedIn, fetchSuggestions]),
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.welcome}>{t('home.welcome', { name: displayName })}</Text>
      <Text style={styles.subtitle}>{t('home.subtitle')}</Text>

      {/* Setup Checklist */}
      {user && (
        <View style={styles.section}>
          <SetupChecklist user={user} />
        </View>
      )}

      {/* Collection Summary (requires auth) */}
      {isLoggedIn && (
        <View style={styles.section}>
          <CollectionSummary />
        </View>
      )}

      {/* Smart Trades Section (requires auth) */}
      {isLoggedIn && (
        <View style={styles.section}>
          <SmartTradesSection />
        </View>
      )}

      {/* Analytics Section */}
      {isLoggedIn && (
        <View style={styles.section}>
          {isPremium ? (
            <TouchableOpacity
              style={styles.analyticsCard}
              onPress={() => router.push('/analytics' as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.previewIcon, { backgroundColor: '#f0c04020' }]}>
                <ChartBar size={28} color={colors.primary} weight="regular" />
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewTitle}>{t('premium.analyticsTitle')}</Text>
                <Text style={styles.previewDescription}>
                  {t('premium.analyticsDescription')}
                </Text>
              </View>
              <CaretRight size={18} color={colors.textMuted} weight="regular" />
            </TouchableOpacity>
          ) : (
            <LockedFeatureCard
              title={t('premium.analyticsTitle')}
              description={t('premium.analyticsDescription')}
              icon="analytics"
              onPress={() => router.push('/(tabs)/profile')}
            />
          )}
        </View>
      )}

      {/* Coming Soon Previews */}
      <Text style={styles.previewsTitle}>{t('home.comingSoon')}</Text>
      {PREVIEWS.map((preview, index) => (
        <View key={index} style={styles.previewCard}>
          <View style={[styles.previewIcon, { backgroundColor: preview.color + '20' }]}>
            <preview.Icon size={28} color={preview.color} weight="regular" />
          </View>
          <View style={styles.previewContent}>
            <Text style={styles.previewTitle}>{t(preview.titleKey)}</Text>
            <Text style={styles.previewDescription}>{t(preview.descKey)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  welcome: {
    ...typography.heading,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  previewsTitle: {
    ...typography.subheading,
    marginBottom: spacing.md,
  },
  analyticsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  previewDescription: {
    ...typography.caption,
    lineHeight: 18,
  },
});
