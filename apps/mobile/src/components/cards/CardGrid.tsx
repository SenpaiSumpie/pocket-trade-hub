import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { CardThumbnail } from './CardThumbnail';
import { CardCompactItem } from './CardCompactItem';
import { CardListItem } from './CardListItem';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card, CardSet } from '@pocket-trade-hub/shared';
import type { Priority } from '@pocket-trade-hub/shared';
import type { CardLayoutMode } from '@/src/stores/layoutPreference';
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

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
  layoutMode?: CardLayoutMode;
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[skeletonStyles.card, { opacity }]}>
      <View style={skeletonStyles.image} />
      <View style={skeletonStyles.textLine} />
      <View style={skeletonStyles.textShort} />
    </Animated.View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={skeletonStyles.container}>
      {Array.from({ length: 9 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
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
  layoutMode = 'grid',
}: CardGridProps) {
  if (loading && cards.length === 0) {
    return <LoadingSkeleton />;
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

  const numColumns = layoutMode === 'grid' ? 3 : layoutMode === 'compact' ? 2 : 1;

  return (
    <FlashList
      key={layoutMode}
      data={cards}
      numColumns={numColumns}
      renderItem={({ item, index }) => {
        if (layoutMode === 'compact') {
          return (
            <CardCompactItem
              card={item}
              onPress={() => onCardPress(item, index)}
              onLongPress={onCardLongPress ? () => onCardLongPress(item, index) : undefined}
              setName={getSetName(item.setId)}
              dimmed={isDimmed(item.id)}
            />
          );
        }
        if (layoutMode === 'list') {
          return (
            <CardListItem
              card={item}
              onPress={() => onCardPress(item, index)}
              onLongPress={onCardLongPress ? () => onCardLongPress(item, index) : undefined}
              setName={getSetName(item.setId)}
              dimmed={isDimmed(item.id)}
            />
          );
        }
        // Default: grid mode
        return (
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
        );
      }}
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

const skeletonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.xs,
  },
  card: {
    flex: 1,
    padding: spacing.xs,
  },
  image: {
    aspectRatio: 0.715,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
  },
  textLine: {
    height: 10,
    borderRadius: 4,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
    width: '80%',
  },
  textShort: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
    width: '50%',
  },
});

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
