import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Package, MagnifyingGlass, Plus } from 'phosphor-react-native';
import { useTranslation } from 'react-i18next';
import Animated from 'react-native-reanimated';
import { useCollapsibleHeader } from '@/src/hooks/useCollapsibleHeader';
import { CollapsibleHeader } from '@/src/components/navigation/CollapsibleHeader';
import { useStaggeredList } from '@/src/hooks/useStaggeredList';
import { useToast } from '@/src/hooks/useToast';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { MarketPostSkeleton } from '@/src/components/skeleton/MarketPostSkeleton';
import { colors, spacing } from '@/src/constants/theme';
import { useMarketplace } from '@/src/hooks/useMarketplace';
import { MarketFilters } from '@/src/components/market/MarketFilters';
import { PostCard } from '@/src/components/market/PostCard';
import { PostDetailModal } from '@/src/components/market/PostDetailModal';
import { PostCreationModal } from '@/src/components/market/PostCreationModal';
import type { MarketPost } from '@/src/stores/posts';

export default function MarketScreen() {
  const { scrollHandler, headerStyle, searchRowStyle, titleStyle, borderStyle, HEADER_MAX } = useCollapsibleHeader();
  const { t } = useTranslation();
  const { posts, loading, hasMore, refresh, loadMore, filters } = useMarketplace();
  const [selectedPost, setSelectedPost] = useState<MarketPost | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const toast = useToast();

  // Staggered list entrance animation
  const staggerCount = loading ? 0 : posts.length;
  const { onLayout, getItemStyle } = useStaggeredList(staggerCount);

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
    ({ item, index }: { item: MarketPost; index: number }) => (
      <Animated.View style={getItemStyle(index)}>
        <PostCard post={item} onPress={() => setSelectedPost(item)} />
      </Animated.View>
    ),
    [getItemStyle],
  );

  // Determine empty state type
  const hasActiveFilters = !!(filters.search || filters.type || filters.set || filters.rarity || filters.language);

  const renderEmpty = useCallback(() => {
    if (loading) {
      return <MarketPostSkeleton />;
    }

    if (hasActiveFilters) {
      return (
        <EmptyState
          icon={MagnifyingGlass}
          title="No results found"
          subtitle="Try different keywords or clear your filters"
          ctaLabel="Clear Filters"
          onCta={() => {
            // Clear is handled by MarketFilters -- trigger refresh
            refresh();
          }}
        />
      );
    }

    return (
      <EmptyState
        icon={Package}
        title="No posts yet"
        subtitle="Be the first to post a trade offer in the market"
        ctaLabel="Create Post"
        onCta={() => setShowCreate(true)}
      />
    );
  }, [loading, hasActiveFilters, refresh]);

  const renderFooter = useCallback(() => {
    if (!loading || posts.length === 0) return null;
    return (
      <View style={styles.footer}>
        <MarketPostSkeleton />
      </View>
    );
  }, [loading, posts.length]);

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
        onLayout={onLayout}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#f0c040"
            colors={["#f0c040"]}
          />
        }
        contentContainerStyle={{ ...styles.listContent, paddingTop: HEADER_MAX }}
      />

      {/* FAB to create post */}
      <Button
        label="Create Post"
        variant="primary"
        onPress={() => setShowCreate(true)}
        Icon={Plus}
        style={styles.fab}
      />

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
          toast.success('Post created');
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
    paddingBottom: spacing.xxl + 60,
  },
  footer: {
    paddingVertical: spacing.lg,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.lg,
    minWidth: 140,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
