import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { CardThumbnail } from './CardThumbnail';
import { CardGridSkeleton } from '@/src/components/skeleton/CardGridSkeleton';
import { colors, spacing } from '@/src/constants/theme';
import type { Card, CardSet } from '@pocket-trade-hub/shared';
import type { Priority } from '@pocket-trade-hub/shared';

interface CardGridProps {
  cards: Card[];
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onCardPress: (card: Card, index: number) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  isSearchMode?: boolean;
  sets?: CardSet[];
  onCardLongPress?: (card: Card, index: number) => void;
  collectionByCardId?: Record<string, number>;
  wantedByCardId?: Record<string, Priority>;
  mode?: 'browse' | 'collection' | 'wanted';
  checklistMode?: boolean;
  checklistSelections?: Set<string>;
  onCheckToggle?: (cardId: string) => void;
  onScroll?: any;
  scrollEventThrottle?: number;
  contentContainerStyleExtra?: Record<string, any>;
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.title}>{t('cards.noCards')}</Text>
      <Text style={emptyStyles.subtitle}>
        {t('common.noResults')}
      </Text>
    </View>
  );
}

export function CardGrid({
  cards,
  loading,
  hasMore,
  onLoadMore,
  onCardPress,
  onRefresh,
  refreshing = false,
  isSearchMode = false,
  sets = [],
  onCardLongPress,
  collectionByCardId,
  wantedByCardId,
  mode = 'browse',
  checklistMode = false,
  checklistSelections,
  onCheckToggle,
  onScroll,
  scrollEventThrottle,
  contentContainerStyleExtra,
}: CardGridProps) {
  if (loading && cards.length === 0) {
    return <CardGridSkeleton />;
  }

  if (!loading && cards.length === 0) {
    return <EmptyState />;
  }

  const getSetName = (setId: string): string | undefined =>
    sets.find((s) => s.id === setId)?.name;

  const isDimmed = (cardId: string): boolean => {
    if (mode === 'collection' && collectionByCardId) {
      return !(cardId in collectionByCardId);
    }
    if (mode === 'wanted' && wantedByCardId) {
      return !(cardId in wantedByCardId);
    }
    return false;
  };

  return (
    <FlashList
      data={cards}
      numColumns={3}
      renderItem={({ item, index }) => (
        <CardThumbnail
          card={item}
          onPress={() => onCardPress(item, index)}
          showSetBadge={isSearchMode}
          setName={getSetName(item.setId)}
          quantity={collectionByCardId?.[item.id]}
          priority={wantedByCardId?.[item.id]}
          dimmed={isDimmed(item.id)}
          onLongPress={onCardLongPress ? () => onCardLongPress(item, index) : undefined}
          checklistMode={checklistMode}
          checked={checklistSelections?.has(item.id)}
          onCheckToggle={onCheckToggle ? () => onCheckToggle(item.id) : undefined}
          inCollection={mode !== 'collection' && collectionByCardId != null && item.id in collectionByCardId}
          isWanted={mode !== 'wanted' && wantedByCardId != null && item.id in wantedByCardId}
        />
      )}
      keyExtractor={(item) => item.id}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading && cards.length > 0 ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ paddingVertical: spacing.lg }}
          />
        ) : null
      }
      contentContainerStyle={{ paddingHorizontal: spacing.xs, ...contentContainerStyleExtra }}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle ?? 16}
    />
  );
}

const emptyStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
