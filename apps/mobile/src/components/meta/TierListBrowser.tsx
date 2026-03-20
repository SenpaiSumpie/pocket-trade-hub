import { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import { useTierListStore } from '@/src/stores/tierlists';
import { TierListCard } from './TierListCard';
import type { TierList } from '@pocket-trade-hub/shared';

type SortOption = 'most_liked' | 'newest';

const SORT_OPTIONS: Array<{ key: SortOption; labelKey: string }> = [
  { key: 'most_liked', labelKey: 'meta.sortMostLiked' },
  { key: 'newest', labelKey: 'meta.sortNewest' },
];

export function TierListBrowser() {
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
    ({ item }: { item: TierList }) => <TierListCard tierList={item} />,
    [],
  );

  // Loading state
  if (loading && tierLists.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('meta.loadingTierLists')}</Text>
      </View>
    );
  }

  // Empty state
  if (!loading && tierLists.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="list-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{t('meta.noTierLists')}</Text>
        <Text style={styles.emptySubtitle}>{t('meta.noTierListsHint')}</Text>
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
        data={sortedLists}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        estimatedItemSize={120}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
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
      <Pressable style={styles.fab} onPress={() => router.push('/create-tier-list' as any)}>
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>
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
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
