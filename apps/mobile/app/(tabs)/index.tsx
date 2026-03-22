import { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Stack, GitBranch, PaperPlaneTilt, ChartBar, CaretRight, Lightbulb } from 'phosphor-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { useAuthStore } from '@/src/stores/auth';
import SetupChecklist from '@/src/components/SetupChecklist';
import CollectionSummary from '@/src/components/cards/CollectionSummary';
import { LockedFeatureCard } from '@/src/components/premium/LockedFeatureCard';
import { SmartTradesSection } from '@/src/components/suggestions/SmartTradesSection';
import { usePremiumStore } from '@/src/stores/premium';
import { useSuggestionsStore } from '@/src/stores/suggestions';
import { Card, Text, EmptyState } from '@/src/components/ui';
import { useStaggeredList } from '@/src/hooks/useStaggeredList';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { colors, spacing } from '@/src/constants/theme';

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

// Dashboard section count: setup checklist, collection summary, smart trades, analytics, previews header
const SECTION_COUNT = 5;

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const displayName = user?.displayName || 'Trainer';
  const isPremium = usePremiumStore((s) => s.isPremium);
  const fetchSuggestions = useSuggestionsStore((s) => s.fetchSuggestions);
  const suggestions = useSuggestionsStore((s) => s.suggestions);
  const suggestionsLoading = useSuggestionsStore((s) => s.loading);
  const suggestionsPremium = useSuggestionsStore((s) => s.isPremium);

  const [refreshing, setRefreshing] = useState(false);

  const { onLayout, getItemStyle } = useStaggeredList(SECTION_COUNT);

  // Fetch suggestions when Home tab gains focus
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        fetchSuggestions();
      }
    }, [isLoggedIn, fetchSuggestions]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (isLoggedIn) {
        await fetchSuggestions(true);
      }
    } finally {
      setRefreshing(false);
    }
  }, [isLoggedIn, fetchSuggestions]);

  // Smart trades section: show shimmer while loading, EmptyState when premium + empty
  const renderSmartTradesContent = () => {
    if (suggestionsLoading && suggestions.length === 0) {
      // Shimmer skeleton for loading state
      return (
        <Card>
          <Shimmer>
            <ShimmerBox height={16} width="60%" style={styles.shimmerTitle} />
            <ShimmerBox height={60} style={styles.shimmerRow} />
            <ShimmerBox height={60} style={styles.shimmerRow} />
            <ShimmerBox height={60} width="80%" />
          </Shimmer>
        </Card>
      );
    }

    if (suggestionsPremium && suggestions.length === 0 && !suggestionsLoading) {
      // Premium user with no suggestions — show EmptyState
      return (
        <Card>
          <EmptyState
            icon={Lightbulb}
            title="No trade suggestions"
            subtitle="Add wanted cards to your wishlist to see matches here"
            ctaLabel="Add Wanted Cards"
            onCta={() => router.push('/(tabs)/trades' as any)}
          />
        </Card>
      );
    }

    return <SmartTradesSection />;
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#f0c040"
          colors={["#f0c040"]}
        />
      }
    >
      <Text preset="heading" color={colors.primary} style={styles.welcome}>
        {t('home.welcome', { name: displayName })}
      </Text>
      <Text preset="label" style={styles.subtitle}>
        {t('home.subtitle')}
      </Text>

      <View onLayout={onLayout}>
        {/* Setup Checklist */}
        {user && (
          <Animated.View style={[styles.section, getItemStyle(0)]}>
            <SetupChecklist user={user} />
          </Animated.View>
        )}

        {/* Collection Summary (requires auth) */}
        {isLoggedIn && (
          <Animated.View style={[styles.section, getItemStyle(1)]}>
            <CollectionSummary />
          </Animated.View>
        )}

        {/* Smart Trades Section (requires auth) */}
        {isLoggedIn && (
          <Animated.View style={[styles.section, getItemStyle(2)]}>
            {renderSmartTradesContent()}
          </Animated.View>
        )}

        {/* Analytics Section */}
        {isLoggedIn && (
          <Animated.View style={[styles.section, getItemStyle(3)]}>
            {isPremium ? (
              <Card
                onPress={() => router.push('/analytics' as any)}
                style={styles.analyticsCard}
              >
                <View style={styles.analyticsInner}>
                  <View style={[styles.previewIcon, { backgroundColor: '#f0c04020' }]}>
                    <ChartBar size={28} color={colors.primary} weight="regular" />
                  </View>
                  <View style={styles.previewContent}>
                    <Text preset="body" style={styles.previewTitle}>
                      {t('premium.analyticsTitle')}
                    </Text>
                    <Text preset="label">
                      {t('premium.analyticsDescription')}
                    </Text>
                  </View>
                  <CaretRight size={18} color={colors.textMuted} weight="regular" />
                </View>
              </Card>
            ) : (
              <LockedFeatureCard
                title={t('premium.analyticsTitle')}
                description={t('premium.analyticsDescription')}
                Icon={ChartBar}
                onPress={() => router.push('/(tabs)/profile')}
              />
            )}
          </Animated.View>
        )}

        {/* Coming Soon Previews */}
        <Animated.View style={getItemStyle(4)}>
          <Text preset="subheading" style={styles.previewsTitle}>
            {t('home.comingSoon')}
          </Text>
          {PREVIEWS.map((preview, index) => (
            <Card key={index} style={styles.previewCard}>
              <View style={styles.previewInner}>
                <View style={[styles.previewIcon, { backgroundColor: preview.color + '20' }]}>
                  <preview.Icon size={28} color={preview.color} weight="regular" />
                </View>
                <View style={styles.previewContent}>
                  <Text preset="body" style={styles.previewTitle}>
                    {t(preview.titleKey)}
                  </Text>
                  <Text preset="label">
                    {t(preview.descKey)}
                  </Text>
                </View>
              </View>
            </Card>
          ))}
        </Animated.View>
      </View>
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
    marginBottom: spacing.xs,
  },
  subtitle: {
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  previewsTitle: {
    marginBottom: spacing.md,
  },
  analyticsCard: {
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  analyticsInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewCard: {
    marginBottom: spacing.md,
  },
  previewInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  shimmerTitle: {
    marginBottom: spacing.md,
  },
  shimmerRow: {
    marginBottom: spacing.sm,
  },
});
