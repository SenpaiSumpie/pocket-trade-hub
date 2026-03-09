import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMatches } from '@/src/hooks/useMatches';
import { useTradesStore } from '@/src/stores/trades';
import { MatchCard } from '@/src/components/trades/MatchCard';
import { MatchDetailModal } from '@/src/components/trades/MatchDetailModal';
import { MatchSortToggle } from '@/src/components/trades/MatchSortToggle';
import { colors, typography, spacing } from '@/src/constants/theme';
import type { TradeMatch } from '@pocket-trade-hub/shared';

export default function TradesScreen() {
  const { matches, isLoading, refresh, markSeen, sortBy, setSortBy } = useMatches();

  const [selectedMatch, setSelectedMatch] = useState<TradeMatch | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Clear unseen count and background refresh when tab is focused
  useFocusEffect(
    useCallback(() => {
      useTradesStore.getState().clearUnseen();
      // Background refresh on focus (non-blocking)
      refresh().catch(() => {});
    }, [refresh]),
  );

  const handleCardPress = useCallback(
    (match: TradeMatch) => {
      setSelectedMatch(match);
      setModalVisible(true);
      if (!match.seen) {
        markSeen(match.id);
      }
    },
    [markSeen],
  );

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedMatch(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Initial loading state
  if (isLoading && matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding matches...</Text>
      </View>
    );
  }

  // Empty state
  if (!isLoading && matches.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="swap-horizontal-outline" size={64} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No matches yet</Text>
        <Text style={styles.emptySubtitle}>
          Add cards to your collection and wanted list to find trade partners
        </Text>
        <Text style={styles.emptyHint}>
          Start by adding cards on the Cards tab
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trade Matches</Text>
        <MatchSortToggle sortBy={sortBy} onSortChange={setSortBy} />
      </View>

      {/* Match list */}
      <FlashList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchCard match={item} onPress={() => handleCardPress(item)} />
        )}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
      />

      {/* Detail modal */}
      <MatchDetailModal
        match={selectedMatch}
        visible={modalVisible}
        onClose={handleCloseModal}
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
