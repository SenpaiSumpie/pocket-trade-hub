import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMatches } from '@/src/hooks/useMatches';
import { useProposals } from '@/src/hooks/useProposals';
import { useTradesStore } from '@/src/stores/trades';
import { useAuthStore } from '@/src/stores/auth';
import { MatchCard } from '@/src/components/trades/MatchCard';
import { MatchDetailModal } from '@/src/components/trades/MatchDetailModal';
import { MatchSortToggle } from '@/src/components/trades/MatchSortToggle';
import { ProposalCard } from '@/src/components/trades/ProposalCard';
import { ProposalDetailModal } from '@/src/components/trades/ProposalDetailModal';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';
import type { TradeMatch, TradeProposal } from '@pocket-trade-hub/shared';

type ProposalDirection = 'all' | 'incoming' | 'outgoing';

const DIRECTION_OPTIONS: { value: ProposalDirection; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
];

export default function TradesScreen() {
  const { matches, isLoading, refresh, markSeen, sortBy, setSortBy } = useMatches();
  const { proposals, loading: proposalsLoading, fetchProposals, direction } = useProposals();
  const activeSegment = useTradesStore((s) => s.activeSegment);
  const setActiveSegment = useTradesStore((s) => s.setActiveSegment);
  const setProposalDirection = useTradesStore((s) => s.setProposalDirection);
  const currentUserId = useAuthStore((s) => s.user?.id) ?? '';

  const [selectedMatch, setSelectedMatch] = useState<TradeMatch | null>(null);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [proposalModalVisible, setProposalModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Clear unseen count and background refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      useTradesStore.getState().clearUnseen();
      // Background refresh on focus (non-blocking)
      refresh().catch(() => {});
      if (activeSegment === 'proposals') {
        fetchProposals().catch(() => {});
      }
    }, [refresh, activeSegment, fetchProposals]),
  );

  // Fetch proposals when switching to proposals tab or direction changes
  useEffect(() => {
    if (activeSegment === 'proposals') {
      fetchProposals();
    }
  }, [activeSegment, direction, fetchProposals]);

  const handleMatchPress = useCallback(
    (match: TradeMatch) => {
      setSelectedMatch(match);
      setMatchModalVisible(true);
      if (!match.seen) {
        markSeen(match.id);
      }
    },
    [markSeen],
  );

  const handleCloseMatchModal = useCallback(() => {
    setMatchModalVisible(false);
    setSelectedMatch(null);
  }, []);

  const handleProposalPress = useCallback((proposal: TradeProposal) => {
    setSelectedProposalId(proposal.id);
    setProposalModalVisible(true);
  }, []);

  const handleCloseProposalModal = useCallback(() => {
    setProposalModalVisible(false);
    setSelectedProposalId(null);
    // Refetch proposals to pick up changes
    fetchProposals().catch(() => {});
  }, [fetchProposals]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    if (activeSegment === 'matches') {
      await refresh();
    } else {
      await fetchProposals();
    }
    setRefreshing(false);
  }, [activeSegment, refresh, fetchProposals]);

  const handleDirectionChange = useCallback(
    (dir: ProposalDirection) => {
      setProposalDirection(dir);
    },
    [setProposalDirection],
  );

  const loading = activeSegment === 'matches' ? isLoading : proposalsLoading;
  const isEmpty = activeSegment === 'matches' ? matches.length === 0 : proposals.length === 0;

  // Initial loading state
  if (loading && isEmpty) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          {activeSegment === 'matches' ? 'Finding matches...' : 'Loading proposals...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trades</Text>

        {/* Segment toggle */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segmentPill, activeSegment === 'matches' && styles.segmentPillActive]}
            onPress={() => setActiveSegment('matches')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'matches' && styles.segmentTextActive,
              ]}
            >
              Matches
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentPill, activeSegment === 'proposals' && styles.segmentPillActive]}
            onPress={() => setActiveSegment('proposals')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.segmentText,
                activeSegment === 'proposals' && styles.segmentTextActive,
              ]}
            >
              Proposals
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sub-filters */}
        {activeSegment === 'matches' && (
          <MatchSortToggle sortBy={sortBy} onSortChange={setSortBy} />
        )}
        {activeSegment === 'proposals' && (
          <View style={styles.directionRow}>
            {DIRECTION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.directionPill,
                  direction === opt.value && styles.directionPillActive,
                ]}
                onPress={() => handleDirectionChange(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.directionText,
                    direction === opt.value && styles.directionTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Empty state */}
      {!loading && isEmpty ? (
        <View style={styles.centerContainer}>
          {activeSegment === 'matches' ? (
            <>
              <Ionicons name="swap-horizontal-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptySubtitle}>
                Add cards to your collection and wanted list to find trade partners
              </Text>
              <Text style={styles.emptyHint}>Start by adding cards on the Cards tab</Text>
            </>
          ) : (
            <>
              <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No proposals yet</Text>
              <Text style={styles.emptySubtitle}>
                Create one from a match!
              </Text>
              <Text style={styles.emptyHint}>
                Switch to Matches and tap a match to propose a trade
              </Text>
            </>
          )}
        </View>
      ) : activeSegment === 'matches' ? (
        /* Match list */
        <FlashList
          data={matches}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchCard match={item} onPress={() => handleMatchPress(item)} />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        /* Proposal list */
        <FlashList
          data={proposals}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProposalCard
              proposal={item}
              currentUserId={currentUserId}
              onPress={() => handleProposalPress(item)}
            />
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Detail modals */}
      <MatchDetailModal
        match={selectedMatch}
        visible={matchModalVisible}
        onClose={handleCloseMatchModal}
      />

      <ProposalDetailModal
        visible={proposalModalVisible}
        onClose={handleCloseProposalModal}
        proposalId={selectedProposalId}
        currentUserId={currentUserId}
      />
    </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
  },
  title: {
    ...typography.heading,
    textAlign: 'center',
  },
  // Segment toggle
  segmentRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  segmentPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  segmentPillActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    ...typography.body,
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 15,
  },
  segmentTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  // Direction filter
  directionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  directionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  directionPillActive: {
    backgroundColor: colors.primaryDark,
  },
  directionText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  directionTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
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
    marginTop: spacing.md,
    maxWidth: 280,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.sm,
  },
});
