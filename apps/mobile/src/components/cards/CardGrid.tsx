import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CardThumbnail } from './CardThumbnail';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card, CardSet } from '@pocket-trade-hub/shared';
import type { Priority } from '@pocket-trade-hub/shared';
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
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.title}>No cards found</Text>
      <Text style={emptyStyles.subtitle}>
        Try a different search term or adjust your filters
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
      contentContainerStyle={{ paddingHorizontal: spacing.xs }}
      onRefresh={onRefresh}
      refreshing={refreshing}
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
