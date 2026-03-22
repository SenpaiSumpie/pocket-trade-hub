import { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ListBullets } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import Animated from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useTierListStore } from '@/src/stores/tierlists';
import { TierListCard } from './TierListCard';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { TierListSkeleton } from '@/src/components/skeleton/TierListSkeleton';
import type { TierList } from '@pocket-trade-hub/shared';
import type { ViewStyle } from 'react-native';

type SortOption = 'most_liked' | 'newest';

const SORT_OPTIONS: Array<{ key: SortOption; labelKey: string }> = [
  { key: 'most_liked', labelKey: 'meta.sortMostLiked' },
  { key: 'newest', labelKey: 'meta.sortNewest' },
];

interface TierListBrowserProps {
  onScroll?: any;
  scrollEventThrottle?: number;
  contentContainerStyleExtra?: Record<string, any>;
  getItemStyle?: (index: number) => ViewStyle | object;
  onStaggerLayout?: () => void;
}

export function TierListBrowser({
  onScroll,
  scrollEventThrottle,
  contentContainerStyleExtra,
  getItemStyle,
  onStaggerLayout,
}: TierListBrowserProps = {}) {
  const { t } = useTranslation();
  const tierLists = useTierListStore((s) => s.tierLists);
  const loading = useTierListStore((s) => s.loading);
  const total = useTierListStore((s) => s.total);
  const sortBy = useTierListStore((s) => s.sortBy);
  const fetchTierLists = useTierListStore((s) => s.fetchTierLists);
  const loadMore = useTierListStore((s) => s.loadMore);
  const setSortBy = useTierListStore((s) => s.setSortBy);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTierLists();
  }, [fetchTierLists]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTierLists();
    setRefreshing(false);
  }, [fetchTierLists]);

  const handleEndReached = useCallback(() => {
    if (!loading && tierLists.length < total) {
      loadMore();
    }
  }, [loading, tierLists.length, total, loadMore]);

  // Sort: official tier lists always first
  const sortedLists = [...tierLists].sort((a, b) => {
    if (a.isOfficial && !b.isOfficial) return -1;
    if (!a.isOfficial && b.isOfficial) return 1;
    return 0;
  });

  const renderItem = useCallback(
    ({ item, index }: { item: TierList; index: number }) => (
      <Animated.View style={getItemStyle?.(index)}>
        <TierListCard tierList={item} />
      </Animated.View>
    ),
    [getItemStyle],
  );

  // Loading state
  if (loading && tierLists.length === 0) {
    return <TierListSkeleton />;
  }

  // Empty state
  if (!loading && tierLists.length === 0) {
    return (
      <EmptyState
        icon={ListBullets}
        title={t('meta.noTierLists')}
        subtitle={t('meta.noTierListsHint')}
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
        data={sortedLists}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={120}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#f0c040"
            colors={["#f0c040"]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle ?? 16}
        contentContainerStyle={{ ...styles.listContent, ...contentContainerStyleExtra }}
        ListFooterComponent={
          loading && tierLists.length > 0 ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.footerLoader}
            />
          ) : null
        }
      />

      {/* Create Tier List FAB */}
      <Button
        label="+"
        variant="primary"
        size="lg"
        onPress={() => router.push('/create-tier-list' as any)}
        style={styles.fab}
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
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl + 60,
  },
  footerLoader: {
    paddingVertical: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    minWidth: 56,
  },
});
