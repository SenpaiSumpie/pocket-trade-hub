import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { usePremiumStore } from '@/src/stores/premium';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import type { AnalyticsCard } from '@pocket-trade-hub/shared';

const RARITY_SYMBOLS: Record<string, string> = {
  diamond1: '\u2666',
  diamond2: '\u2666\u2666',
  diamond3: '\u2666\u2666\u2666',
  diamond4: '\u2666\u2666\u2666\u2666',
  star1: '\u2605',
  star2: '\u2605\u2605',
  star3: '\u2605\u2605\u2605',
  crown: '\u265B',
};

interface SectionConfig {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  data: AnalyticsCard[];
  formatStat: (card: AnalyticsCard) => string;
  emptyText: string;
}

function AnalyticsSection({ config }: { config: SectionConfig }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleRow}>
          <Ionicons name={config.icon} size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>{config.title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.sectionContent}>
          {config.data.length === 0 ? (
            <Text style={styles.emptyText}>{config.emptyText}</Text>
          ) : (
            config.data.map((card, index) => (
              <View key={card.cardId} style={styles.cardRow}>
                <Text style={styles.rank}>#{card.rank}</Text>
                <Image
                  source={{ uri: card.cardImageUrl }}
                  style={styles.cardThumb}
                  contentFit="cover"
                  transition={150}
                />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {card.cardName}
                  </Text>
                  <Text style={styles.rarityText}>
                    {card.rarity ? (RARITY_SYMBOLS[card.rarity] ?? card.rarity) : ''}
                  </Text>
                </View>
                <Text style={styles.statText}>{config.formatStat(card)}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function AnalyticsDashboard() {
  const analyticsData = usePremiumStore((s) => s.analyticsData);
  const loading = usePremiumStore((s) => s.loading);
  const fetchAnalytics = usePremiumStore((s) => s.fetchAnalytics);

  // Fetch on mount if not already loaded
  useEffect(() => {
    if (!analyticsData) {
      fetchAnalytics();
    }
  }, []);

  if (loading && !analyticsData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  const sections: SectionConfig[] = [
    {
      key: 'mostWanted',
      title: 'Most Wanted Cards',
      icon: 'flame',
      data: analyticsData?.mostWanted ?? [],
      formatStat: (card) => `${card.value} traders want this`,
      emptyText: 'No demand data yet',
    },
    {
      key: 'leastAvailable',
      title: 'Least Available Cards',
      icon: 'warning',
      data: analyticsData?.leastAvailable ?? [],
      formatStat: (card) => `Only ${card.value} trainers have this`,
      emptyText: 'No scarcity data yet',
    },
    {
      key: 'trending',
      title: 'Trending Cards',
      icon: 'trending-up',
      data: analyticsData?.trending ?? [],
      formatStat: (card) => `+${card.value} this week`,
      emptyText: 'No trending data yet',
    },
    {
      key: 'tradePower',
      title: 'Your Trade Power',
      icon: 'flash',
      data: analyticsData?.tradePower ?? [],
      formatStat: (card) => `${card.value} traders want your card`,
      emptyText: 'Add cards to your collection to see your trade power',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {sections.map((section) => (
        <AnalyticsSection key={section.key} config={section} />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 17,
    color: colors.text,
  },
  sectionContent: {
    gap: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  rank: {
    ...typography.caption,
    color: colors.textMuted,
    width: 24,
    textAlign: 'center',
    fontWeight: '600',
  },
  cardThumb: {
    width: 48,
    height: 67,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
  },
  rarityText: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  statText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'right',
    maxWidth: 100,
  },
});
