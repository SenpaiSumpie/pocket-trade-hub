import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useMetaStore } from '@/src/stores/meta';
import { DeckDetailModal } from './DeckDetailModal';
import type { DeckMeta } from '@pocket-trade-hub/shared';

type SortOption = 'winRate' | 'usageRate' | 'trending';

const SORT_OPTIONS: Array<{ key: SortOption; labelKey: string }> = [
  { key: 'winRate', labelKey: 'meta.winRate' },
  { key: 'usageRate', labelKey: 'meta.usageRate' },
  { key: 'trending', labelKey: 'meta.trending' },
];

export function DeckRankingList() {
  const { t } = useTranslation();
  const decks = useMetaStore((s) => s.decks);
  const loading = useMetaStore((s) => s.loading);
  const error = useMetaStore((s) => s.error);
  const scrapedAt = useMetaStore((s) => s.scrapedAt);
  const sortBy = useMetaStore((s) => s.sortBy);
  const fetchDecks = useMetaStore((s) => s.fetchDecks);
  const setSortBy = useMetaStore((s) => s.setSortBy);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDeck, setSelectedDeck] = useState<DeckMeta | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  }, [fetchDecks]);

  const handleDeckPress = useCallback((deck: DeckMeta) => {
    setSelectedDeck(deck);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedDeck(null);
  }, []);

  const formatRate = (rate: number | null): string => {
    if (rate === null) return '--';
    // Basis points to percentage
    return (rate / 100).toFixed(1) + '%';
  };

  const getTopCards = (deck: DeckMeta): string[] => {
    if (!deck.cards) return [];
    const cards = Array.isArray(deck.cards) ? deck.cards : [];
    return cards.slice(0, 3).map((c: any) => c.name || c);
  };

  const renderDeckItem = useCallback(
    ({ item, index }: { item: DeckMeta; index: number }) => {
      const topCards = getTopCards(item);
      return (
        <Pressable style={styles.deckCard} onPress={() => handleDeckPress(item)}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <View style={styles.deckInfo}>
            <Text style={styles.deckName} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('meta.winRate')}</Text>
                <Text style={styles.statValue}>{formatRate(item.winRate)}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>{t('meta.usageRate')}</Text>
                <Text style={styles.statValue}>{formatRate(item.usageRate)}</Text>
              </View>
            </View>
            {topCards.length > 0 && (
              <Text style={styles.topCardsText} numberOfLines={1}>
                {topCards.join(', ')}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
      );
    },
    [handleDeckPress, t],
  );

  // Loading state
  if (loading && decks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('meta.loadingDecks')}</Text>
      </View>
    );
  }

  // Empty state
  if (!loading && decks.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="trophy-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{t('meta.noDecks')}</Text>
        <Text style={styles.emptySubtitle}>{t('meta.noDecksHint')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sort toggle pills */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => {
          const active = sortBy === opt.key;
          return (
            <Pressable
              key={opt.key}
              style={[styles.sortPill, active && styles.sortPillActive]}
              onPress={() => setSortBy(opt.key)}
            >
              <Text style={[styles.sortPillText, active && styles.sortPillTextActive]}>
                {t(opt.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlashList
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={renderDeckItem}
        estimatedItemSize={90}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        ListFooterComponent={
          scrapedAt ? (
            <Text style={styles.footerText}>
              {t('meta.lastUpdated', { date: new Date(scrapedAt).toLocaleDateString() })}
            </Text>
          ) : null
        }
      />

      <DeckDetailModal
        visible={modalVisible}
        onClose={handleCloseModal}
        deck={selectedDeck}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  sortPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  sortPillTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.xs,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  topCardsText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  footerText: {
    ...typography.caption,
    textAlign: 'center',
    padding: spacing.md,
    color: colors.textMuted,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyTitle: {
    ...typography.subheading,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
});
