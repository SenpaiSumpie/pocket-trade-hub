import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CaretRight, Trophy } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useMetaStore } from '@/src/stores/meta';
import { DeckDetailModal } from './DeckDetailModal';
import { Card } from '@/src/components/ui/Card';
import { Button } from '@/src/components/ui/Button';
import { Badge } from '@/src/components/ui/Badge';
import { Text } from '@/src/components/ui/Text';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { DeckRankingSkeleton } from '@/src/components/skeleton/DeckRankingSkeleton';
import type { DeckMeta } from '@pocket-trade-hub/shared';
import type { ViewStyle } from 'react-native';

type SortOption = 'winRate' | 'usageRate' | 'trending';

const SORT_OPTIONS: Array<{ key: SortOption; labelKey: string }> = [
  { key: 'winRate', labelKey: 'meta.winRate' },
  { key: 'usageRate', labelKey: 'meta.usageRate' },
  { key: 'trending', labelKey: 'meta.trending' },
];

interface DeckRankingListProps {
  onScroll?: any;
  scrollEventThrottle?: number;
  contentContainerStyleExtra?: Record<string, any>;
  getItemStyle?: (index: number) => ViewStyle | object;
  onStaggerLayout?: () => void;
}

export function DeckRankingList({
  onScroll,
  scrollEventThrottle,
  contentContainerStyleExtra,
  getItemStyle,
  onStaggerLayout,
}: DeckRankingListProps = {}) {
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
        <Animated.View style={getItemStyle?.(index)}>
          <Card onPress={() => handleDeckPress(item)} style={styles.deckCard}>
            <View style={styles.deckCardInner}>
              <Badge
                variant="default"
                label={String(index + 1)}
                style={styles.rankBadge}
              />
              <View style={styles.deckInfo}>
                <Text preset="body" style={styles.deckName} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text preset="label">{t('meta.winRate')}</Text>
                    <Text preset="body" style={styles.statValue}>{formatRate(item.winRate)}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text preset="label">{t('meta.usageRate')}</Text>
                    <Text preset="body" style={styles.statValue}>{formatRate(item.usageRate)}</Text>
                  </View>
                </View>
                {topCards.length > 0 && (
                  <Text preset="label" style={styles.topCardsText} numberOfLines={1}>
                    {topCards.join(', ')}
                  </Text>
                )}
              </View>
              <CaretRight size={18} color={colors.textMuted} weight="regular" />
            </View>
          </Card>
        </Animated.View>
      );
    },
    [handleDeckPress, t, getItemStyle],
  );

  // Loading state
  if (loading && decks.length === 0) {
    return <DeckRankingSkeleton />;
  }

  // Empty state
  if (!loading && decks.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title={t('meta.noDecks')}
        subtitle={t('meta.noDecksHint')}
      />
    );
  }

  return (
    <View style={styles.container} onLayout={onStaggerLayout}>
      {/* Sort toggle pills */}
      <View style={styles.sortRow}>
        {SORT_OPTIONS.map((opt) => {
          const active = sortBy === opt.key;
          return (
            <Button
              key={opt.key}
              label={t(opt.labelKey)}
              variant={active ? 'secondary' : 'ghost'}
              size="md"
              onPress={() => setSortBy(opt.key)}
            />
          );
        })}
      </View>

      <FlashList
        data={decks}
        keyExtractor={(item) => item.id}
        renderItem={renderDeckItem}
        estimatedItemSize={90}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#f0c040"
            colors={["#f0c040"]}
          />
        }
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle ?? 16}
        contentContainerStyle={{ ...styles.listContent, ...contentContainerStyleExtra }}
        ListFooterComponent={
          scrapedAt ? (
            <Text preset="label" style={styles.footerText}>
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
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  deckCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  deckCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  deckInfo: {
    flex: 1,
  },
  deckName: {
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
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  topCardsText: {
    fontSize: 11,
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
  },
  footerText: {
    textAlign: 'center',
    padding: spacing.md,
  },
});
