import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { CardThumbnail } from './CardThumbnail';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card, CardSet } from '@pocket-trade-hub/shared';
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
}: CardGridProps) {
  if (loading && cards.length === 0) {
    return <LoadingSkeleton />;
  }

  if (!loading && cards.length === 0) {
    return <EmptyState />;
  }

  const getSetName = (setId: string): string | undefined =>
    sets.find((s) => s.id === setId)?.name;

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
      style={{ paddingHorizontal: spacing.sm }}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}

const skeletonStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
  },
  card: {
    width: '33.33%',
    padding: spacing.xs,
  },
  image: {
    aspectRatio: 1 / 1.4,
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
