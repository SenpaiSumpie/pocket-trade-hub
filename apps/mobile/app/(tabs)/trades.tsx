import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import Animated from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { Newspaper, FileText, ArrowLeft, CaretDown, CaretUp, Check, Tag, ArrowsLeftRight, Sparkle } from 'phosphor-react-native';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { usePosts } from '@/src/hooks/usePosts';
import { useProposals } from '@/src/hooks/useProposals';
import { useTradesStore } from '@/src/stores/trades';
import { useAuthStore } from '@/src/stores/auth';
import { MyPostCard } from '@/src/components/trades/MyPostCard';
import { MyPostDetailModal } from '@/src/components/trades/MyPostDetailModal';
import { ProposalCard } from '@/src/components/trades/ProposalCard';
import { ProposalDetailModal } from '@/src/components/trades/ProposalDetailModal';
import { RatingModal } from '@/src/components/trades/RatingModal';
import { Badge, EmptyState, Text } from '@/src/components/ui';
import { PostListSkeleton } from '@/src/components/skeleton/PostListSkeleton';
import { ProposalListSkeleton } from '@/src/components/skeleton/ProposalListSkeleton';
import { useStaggeredList } from '@/src/hooks/useStaggeredList';
import { useTranslation } from 'react-i18next';
import { useCollapsibleHeader } from '@/src/hooks/useCollapsibleHeader';
import { CollapsibleHeader } from '@/src/components/navigation/CollapsibleHeader';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { TradePost, TradeProposal } from '@pocket-trade-hub/shared';

type ProposalDirection = 'all' | 'incoming' | 'outgoing';

type ActiveSegment = 'posts' | 'proposals';
type ProposalView = 'active' | 'history';

const ACTIVE_STATUSES = ['pending', 'accepted', 'countered'];
const HISTORY_STATUSES = ['completed', 'rejected', 'cancelled'];

const SEGMENT_KEYS: Array<{ key: ActiveSegment; labelKey: string; Icon: PhosphorIcon }> = [
  { key: 'posts', labelKey: 'trades.myPosts', Icon: Newspaper },
  { key: 'proposals', labelKey: 'trades.proposals', Icon: FileText },
];

const DIRECTION_KEYS: { value: ProposalDirection; labelKey: string }[] = [
  { value: 'all', labelKey: 'trades.all' },
  { value: 'incoming', labelKey: 'trades.incoming' },
  { value: 'outgoing', labelKey: 'trades.outgoing' },
];

export default function TradesScreen() {
  const { scrollHandler, headerStyle, searchRowStyle, titleStyle, borderStyle, HEADER_MAX } = useCollapsibleHeader();
  const { t } = useTranslation();
  const { myPosts, myPostsLoading, fetchMyPosts } = usePosts();
  const { proposals, loading: proposalsLoading, fetchProposals, direction } = useProposals();
  const activeSegment = useTradesStore((s) => s.activeSegment);
  const setActiveSegment = useTradesStore((s) => s.setActiveSegment);
  const setProposalDirection = useTradesStore((s) => s.setProposalDirection);
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';

  const [selectedPost, setSelectedPost] = useState<TradePost | null>(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [proposalModalVisible, setProposalModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingProposalId, setRatingProposalId] = useState('');
  const [ratingPartnerName, setRatingPartnerName] = useState('');

  // Filter dropdowns
  const [showDirectionDropdown, setShowDirectionDropdown] = useState(false);
  const [proposalView, setProposalView] = useState<ProposalView>('active');

  // Filter proposals client-side by active/history
  const filteredProposals = useMemo(() => {
    const statuses = proposalView === 'active' ? ACTIVE_STATUSES : HISTORY_STATUSES;
    return proposals.filter((p) => p && statuses.includes(p.status));
  }, [proposals, proposalView]);

  // Count pending proposals for badge
  const pendingProposalCount = useMemo(() => {
    return proposals.filter((p) => p?.status === 'pending').length;
  }, [proposals]);

  // Count active posts for badge
  const activePostCount = useMemo(() => {
    return myPosts.filter((p) => p?.status === 'active').length;
  }, [myPosts]);

  // Staggered list animation — gate count behind loaded data (Pitfall 4)
  const loading = activeSegment === 'posts' ? myPostsLoading : proposalsLoading;
  const currentItems = activeSegment === 'posts' ? myPosts : filteredProposals;
  const staggerCount = loading ? 0 : currentItems.length;
  const { onLayout, getItemStyle } = useStaggeredList(staggerCount);

  const isEmpty = currentItems.length === 0;

  // Refresh data when tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchMyPosts().catch(() => {});
      fetchProposals().catch(() => {});
    }, [fetchMyPosts, fetchProposals]),
  );

  // Fetch proposals when direction changes
  useEffect(() => {
    if (activeSegment === 'proposals') {
      fetchProposals(direction);
    }
  }, [activeSegment, direction, fetchProposals]);

  const handlePostPress = useCallback((post: TradePost) => {
    setSelectedPost(post);
    setPostModalVisible(true);
  }, []);

  const handleClosePostModal = useCallback(() => {
    setPostModalVisible(false);
    setSelectedPost(null);
    // Refresh posts in case user closed/deleted
    fetchMyPosts().catch(() => {});
  }, [fetchMyPosts]);

  const handleProposalPress = useCallback((proposal: TradeProposal) => {
    setSelectedProposalId(proposal.id);
    setProposalModalVisible(true);
  }, []);

  const handleCloseProposalModal = useCallback(() => {
    setProposalModalVisible(false);
    setSelectedProposalId(null);
    fetchProposals().catch(() => {});
  }, [fetchProposals]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeSegment === 'posts') {
      await fetchMyPosts();
    } else {
      await fetchProposals();
    }
    setRefreshing(false);
  }, [activeSegment, fetchMyPosts, fetchProposals]);

  const handleRatePartner = useCallback((proposalId: string, _partnerId: string) => {
    setRatingProposalId(proposalId);
    setRatingPartnerName(t('trades.rateYourPartner'));
    setRatingModalVisible(true);
  }, []);

  const handleCloseRatingModal = useCallback(() => {
    setRatingModalVisible(false);
    setRatingProposalId('');
    setRatingPartnerName('');
  }, []);

  const handleSegmentSwitch = useCallback(
    (seg: ActiveSegment) => {
      setActiveSegment(seg);
      setShowDirectionDropdown(false);
    },
    [setActiveSegment],
  );

  const directionLabel = DIRECTION_KEYS.find((o) => o.value === direction)?.labelKey ?? 'trades.all';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <CollapsibleHeader
        title={t('tabs.trades', { defaultValue: 'Trades' })}
        headerStyle={headerStyle}
        searchRowStyle={searchRowStyle}
        titleStyle={titleStyle}
        borderStyle={borderStyle}
      >
        {/* Tab bar */}
        <View style={styles.tabBar}>
          {SEGMENT_KEYS.map((seg, i) => {
            const active = activeSegment === seg.key;
            const badgeCount = seg.key === 'posts' ? activePostCount : pendingProposalCount;
            return (
              <View key={seg.key} style={styles.tabItemWrapper}>
                {i > 0 && <View style={styles.tabDivider} />}
                <Pressable
                  style={[styles.tabItem, active && styles.tabItemActive]}
                  onPress={() => handleSegmentSwitch(seg.key)}
                >
                  <View style={styles.tabIconContainer}>
                    <seg.Icon
                      size={18}
                      color={active ? colors.primary : colors.textMuted}
                      weight={active ? 'fill' : 'regular'}
                    />
                    {badgeCount > 0 && (
                      <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {t(seg.labelKey)}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      </CollapsibleHeader>

      {/* Filter row */}
      {activeSegment === 'proposals' && (
        <View style={[styles.filterRow, { marginTop: HEADER_MAX }]}>
          {/* Active / History toggle */}
          <View style={styles.viewToggle}>
            <Pressable
              style={[styles.viewToggleBtn, proposalView === 'active' && styles.viewToggleBtnActive]}
              onPress={() => setProposalView('active')}
            >
              <Text style={[styles.viewToggleText, proposalView === 'active' && styles.viewToggleTextActive]}>
                {t('trades.activeProposals')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.viewToggleBtn, proposalView === 'history' && styles.viewToggleBtnActive]}
              onPress={() => setProposalView('history')}
            >
              <Text style={[styles.viewToggleText, proposalView === 'history' && styles.viewToggleTextActive]}>
                {t('trades.history')}
              </Text>
            </Pressable>
          </View>
          {/* Direction dropdown */}
          <Pressable
            style={styles.filterDropdownBtn}
            onPress={() => setShowDirectionDropdown(!showDirectionDropdown)}
          >
            <ArrowLeft size={14} color={colors.textSecondary} weight="regular" />
            <Text style={styles.filterDropdownLabel}>{t(directionLabel)}</Text>
            {showDirectionDropdown ? (
              <CaretUp size={12} color={colors.textMuted} weight="regular" />
            ) : (
              <CaretDown size={12} color={colors.textMuted} weight="regular" />
            )}
          </Pressable>
        </View>
      )}

      {/* Direction dropdown menu */}
      {showDirectionDropdown && (
        <View style={styles.dropdownMenu}>
          {DIRECTION_KEYS.map((opt) => {
            const isActive = direction === opt.value;
            return (
              <Pressable
                key={opt.value}
                style={[styles.dropdownItem, isActive && styles.dropdownItemActive]}
                onPress={() => {
                  setProposalDirection(opt.value);
                  setShowDirectionDropdown(false);
                }}
              >
                <Text style={[styles.dropdownItemText, isActive && styles.dropdownItemTextActive]}>
                  {t(opt.labelKey)}
                </Text>
                {isActive && <Check size={16} color={colors.primary} weight="regular" />}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Loading state — skeleton shimmer */}
      {loading && isEmpty ? (
        <View style={[styles.listContainer, { paddingTop: HEADER_MAX }]}>
          {activeSegment === 'posts' ? (
            <PostListSkeleton />
          ) : (
            <ProposalListSkeleton />
          )}
        </View>
      ) : !loading && isEmpty ? (
        /* Empty state — contextual per segment */
        <View style={[styles.centerContainer, { paddingTop: HEADER_MAX }]}>
          {activeSegment === 'posts' ? (
            <EmptyState
              icon={Tag}
              title="No posts yet"
              subtitle="Create a post to start trading with other players"
              ctaLabel="Go to Marketplace"
              onCta={() => { /* navigate to marketplace / post creation */ }}
            />
          ) : proposalView === 'active' ? (
            <EmptyState
              icon={ArrowsLeftRight}
              title="No proposals yet"
              subtitle="When other players propose trades, they'll appear here"
            />
          ) : (
            <EmptyState
              icon={Sparkle}
              title="No trade history"
              subtitle="Completed and closed proposals will appear here"
            />
          )}
        </View>
      ) : activeSegment === 'posts' ? (
        /* My Posts list */
        <FlashList
          data={myPosts}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View style={getItemStyle(index)}>
              <MyPostCard post={item} onPress={() => handlePostPress(item)} />
            </Animated.View>
          )}
          estimatedItemSize={100}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#f0c040"
              colors={["#f0c040"]}
            />
          }
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onLayout={onLayout}
          contentContainerStyle={{ ...styles.listContent, paddingTop: HEADER_MAX }}
        />
      ) : (
        /* Proposal list */
        <FlashList
          data={filteredProposals}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <Animated.View style={getItemStyle(index)}>
              <ProposalCard
                proposal={item}
                currentUserId={currentUserId}
                onPress={() => handleProposalPress(item)}
              />
            </Animated.View>
          )}
          estimatedItemSize={180}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#f0c040"
              colors={["#f0c040"]}
            />
          }
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onLayout={onLayout}
          contentContainerStyle={{ ...styles.listContent, paddingTop: HEADER_MAX }}
        />
      )}

      {/* Detail modals */}
      <MyPostDetailModal
        visible={postModalVisible}
        onClose={handleClosePostModal}
        post={selectedPost}
      />

      <ProposalDetailModal
        visible={proposalModalVisible}
        onClose={handleCloseProposalModal}
        proposalId={selectedProposalId}
        currentUserId={currentUserId}
        onRatePartner={handleRatePartner}
      />

      <RatingModal
        visible={ratingModalVisible}
        onClose={handleCloseRatingModal}
        proposalId={ratingProposalId}
        partnerName={ratingPartnerName}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tabItemWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  tabDivider: {
    width: 1,
    backgroundColor: colors.border,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    gap: 6,
  },
  tabItemActive: {
    backgroundColor: colors.primary + '18',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#e53e3e',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tabBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Filter row
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterDropdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewToggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  viewToggleBtnActive: {
    backgroundColor: colors.primary,
  },
  viewToggleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  viewToggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },

  // Dropdown menu
  dropdownMenu: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  dropdownItemActive: {
    backgroundColor: colors.primary + '18',
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '400',
  },
  dropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
});
