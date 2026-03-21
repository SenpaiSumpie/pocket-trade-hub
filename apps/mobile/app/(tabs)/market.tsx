import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useCollapsibleHeader } from '@/src/hooks/useCollapsibleHeader';
import { CollapsibleHeader } from '@/src/components/navigation/CollapsibleHeader';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import { useMarketplace } from '@/src/hooks/useMarketplace';
import { MarketFilters } from '@/src/components/market/MarketFilters';
import { PostCard } from '@/src/components/market/PostCard';
import { PostDetailModal } from '@/src/components/market/PostDetailModal';
import { PostCreationModal } from '@/src/components/market/PostCreationModal';
import type { MarketPost } from '@/src/stores/posts';

export default function MarketScreen() {
  const { scrollHandler, headerStyle, searchRowStyle, titleStyle, borderStyle, HEADER_MAX } = useCollapsibleHeader();
  const { t } = useTranslation();
  const { posts, loading, hasMore, refresh, loadMore } = useMarketplace();
  const [selectedPost, setSelectedPost] = useState<MarketPost | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !loading) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  const renderItem = useCallback(
    ({ item }: { item: MarketPost }) => (
      <PostCard post={item} onPress={() => setSelectedPost(item)} />
    ),
    [],
  );

  const renderFooter = useCallback(() => {
    if (!loading || posts.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }, [loading, posts.length]);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <Ionicons name="storefront-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>{t('market.noPostsFound')}</Text>
        <Text style={styles.emptySubtitle}>{t('market.noPostsSubtitle')}</Text>
        <Pressable style={styles.emptyButton} onPress={() => setShowCreate(true)}>
          <Ionicons name="add-circle-outline" size={20} color={colors.background} />
          <Text style={styles.emptyButtonText}>{t('market.createPost')}</Text>
        </Pressable>
      </View>
    );
  }, [loading]);

  return (
    <SafeAreaView style={styles.container}>
      <CollapsibleHeader
        title={t('market.title', { defaultValue: 'Market' })}
        headerStyle={headerStyle}
        searchRowStyle={searchRowStyle}
        titleStyle={titleStyle}
        borderStyle={borderStyle}
      >
        <MarketFilters />
      </CollapsibleHeader>

      <FlashList
        data={posts}
        renderItem={renderItem}
        estimatedItemSize={140}
        keyExtractor={(item) => item.id}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ ...styles.listContent, paddingTop: HEADER_MAX }}
      />

      {/* FAB to create post */}
      <Pressable
        style={styles.fab}
        onPress={() => setShowCreate(true)}
      >
        <Ionicons name="add" size={28} color={colors.background} />
      </Pressable>

      {/* Post Detail Modal */}
      <PostDetailModal
        visible={!!selectedPost}
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      {/* Post Creation Modal */}
      <PostCreationModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false);
          refresh();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxl + 60, // space for FAB
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl * 2,
    gap: spacing.sm,
  },
  emptyTitle: {
    ...typography.subheading,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  emptyButtonText: {
    ...typography.body,
    fontWeight: '600',
    color: colors.background,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
