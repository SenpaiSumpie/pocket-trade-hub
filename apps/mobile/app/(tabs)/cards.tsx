import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/src/components/cards/SearchBar';
import { SetPicker } from '@/src/components/cards/SetPicker';
import { FilterChips } from '@/src/components/cards/FilterChips';
import { CardGrid } from '@/src/components/cards/CardGrid';
import { CardDetailModal } from '@/src/components/cards/CardDetailModal';
import { useSets, useCardsBySet, useCardSearch } from '@/src/hooks/useCards';
import { useCardsStore } from '@/src/stores/cards';
import { useCollectionStore } from '@/src/stores/collection';
import { useLoadCollection, useAddToCollection, useBulkUpdateCollection } from '@/src/hooks/useCollection';
import { useLoadWanted } from '@/src/hooks/useWanted';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

type Mode = 'browse' | 'collection' | 'wanted';

const SEGMENTS: Array<{ key: Mode; label: string }> = [
  { key: 'browse', label: 'Browse' },
  { key: 'collection', label: 'My Collection' },
  { key: 'wanted', label: 'Wanted' },
];

export default function CardsScreen() {
  const { sets, loading: setsLoading } = useSets();
  const {
    selectedSetId,
    searchQuery,
    activeFilters,
    isSearchMode,
    setSelectedSet,
    setSearchQuery,
    setFilter,
    removeFilter,
  } = useCardsStore();

  const mode = useCollectionStore((s) => s.mode);
  const setMode = useCollectionStore((s) => s.setMode);
  const collectionByCardId = useCollectionStore((s) => s.collectionByCardId);
  const wantedByCardId = useCollectionStore((s) => s.wantedByCardId);
  const progressBySet = useCollectionStore((s) => s.progressBySet);

  // Load data hooks
  useLoadCollection();
  useLoadWanted();

  const addToCollection = useAddToCollection();
  const bulkUpdate = useBulkUpdateCollection();

  // Auto-select first set when sets load
  useEffect(() => {
    if (sets.length > 0 && !selectedSetId) {
      setSelectedSet(sets[0].id);
    }
  }, [sets, selectedSetId, setSelectedSet]);

  // Data hooks
  const {
    cards: setCards,
    loading: setLoading,
    hasMore,
    loadMore,
    refresh: refreshSet,
  } = useCardsBySet(selectedSetId);

  const {
    results: searchResults,
    loading: searchLoading,
  } = useCardSearch(searchQuery, activeFilters);

  // Detail modal state
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailIndex, setDetailIndex] = useState(0);

  // Checklist mode state
  const [checklistMode, setChecklistMode] = useState(false);
  const [checklistSelections, setChecklistSelections] = useState<Set<string>>(new Set());

  const currentCards = isSearchMode ? searchResults : setCards;
  const currentLoading = isSearchMode ? searchLoading : setLoading;

  // Sort cards by priority in wanted mode
  const displayCards = useMemo(() => {
    if (mode === 'wanted') {
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return [...currentCards].sort((a, b) => {
        const pa = wantedByCardId[a.id];
        const pb = wantedByCardId[b.id];
        if (pa && !pb) return -1;
        if (!pa && pb) return 1;
        if (pa && pb) return (priorityOrder[pa] ?? 3) - (priorityOrder[pb] ?? 3);
        return 0;
      });
    }
    return currentCards;
  }, [currentCards, mode, wantedByCardId]);

  const handleCardPress = useCallback((card: Card, index: number) => {
    setDetailIndex(index);
    setDetailVisible(true);
  }, []);

  const handleRefresh = useCallback(() => {
    if (!isSearchMode) {
      refreshSet();
    }
  }, [isSearchMode, refreshSet]);

  const handleLongPress = useCallback(
    (card: Card) => {
      if (mode === 'browse' || mode === 'collection') {
        addToCollection(card.id, 1);
      }
    },
    [mode, addToCollection],
  );

  // Checklist handlers
  const enterChecklistMode = useCallback(() => {
    // Pre-populate with currently owned cards
    const owned = new Set(
      Object.keys(collectionByCardId).filter((id) =>
        currentCards.some((c) => c.id === id),
      ),
    );
    setChecklistSelections(owned);
    setChecklistMode(true);
  }, [collectionByCardId, currentCards]);

  const exitChecklistMode = useCallback(() => {
    setChecklistMode(false);
    setChecklistSelections(new Set());
  }, []);

  const handleCheckToggle = useCallback((cardId: string) => {
    setChecklistSelections((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setChecklistSelections(new Set(currentCards.map((c) => c.id)));
  }, [currentCards]);

  const handleDeselectAll = useCallback(() => {
    setChecklistSelections(new Set());
  }, []);

  const allSelected = currentCards.length > 0 && checklistSelections.size === currentCards.length;

  const handleSaveChecklist = useCallback(async () => {
    if (!selectedSetId) return;
    const ownedSet = new Set(Object.keys(collectionByCardId));
    const additions = [...checklistSelections].filter((id) => !ownedSet.has(id));
    const removals = [...ownedSet].filter(
      (id) => !checklistSelections.has(id) && currentCards.some((c) => c.id === id),
    );
    if (additions.length > 0 || removals.length > 0) {
      await bulkUpdate(selectedSetId, additions, removals);
    }
    exitChecklistMode();
  }, [selectedSetId, collectionByCardId, checklistSelections, currentCards, bulkUpdate, exitChecklistMode]);

  // Mode switch handler
  const handleModeSwitch = useCallback(
    (newMode: Mode) => {
      if (checklistMode) exitChecklistMode();
      setMode(newMode);
    },
    [setMode, checklistMode, exitChecklistMode],
  );

  // Progress data for SetPicker
  const progressForPicker = useMemo(() => {
    if (mode !== 'collection') return undefined;
    const result: Record<string, { owned: number; total: number }> = {};
    for (const [setId, data] of Object.entries(progressBySet)) {
      result[setId] = { owned: data.owned, total: data.total };
    }
    return result;
  }, [mode, progressBySet]);

  // Find set name for detail modal
  const currentSetName = sets.find((s) => s.id === selectedSetId)?.name;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Segmented control */}
      <View style={styles.segmentRow}>
        {SEGMENTS.map((seg) => {
          const active = mode === seg.key;
          return (
            <Pressable
              key={seg.key}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => handleModeSwitch(seg.key)}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {seg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Checklist mode toggle (collection mode only) */}
      {mode === 'collection' && !isSearchMode && !checklistMode && (
        <View style={styles.checklistToggleRow}>
          <Pressable style={styles.checklistBtn} onPress={enterChecklistMode}>
            <Text style={styles.checklistBtnText}>Checklist Mode</Text>
          </Pressable>
        </View>
      )}

      {/* Checklist header bar */}
      {checklistMode && (
        <View style={styles.checklistHeader}>
          <Pressable onPress={allSelected ? handleDeselectAll : handleSelectAll}>
            <Text style={styles.checklistAction}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Text>
          </Pressable>
          <Text style={styles.checklistCount}>
            {checklistSelections.size}/{currentCards.length}
          </Text>
        </View>
      )}

      {isSearchMode && (
        <FilterChips
          activeFilters={activeFilters}
          sets={sets}
          onSetFilter={setFilter}
          onRemoveFilter={removeFilter}
        />
      )}

      {!isSearchMode && !setsLoading && (
        <SetPicker
          sets={sets}
          selectedSetId={selectedSetId}
          onSelectSet={setSelectedSet}
          progress={progressForPicker}
        />
      )}

      <View style={styles.grid}>
        <CardGrid
          cards={displayCards}
          loading={currentLoading}
          hasMore={!isSearchMode ? hasMore : false}
          onLoadMore={!isSearchMode ? loadMore : undefined}
          onCardPress={handleCardPress}
          onRefresh={handleRefresh}
          refreshing={false}
          isSearchMode={isSearchMode}
          sets={sets}
          mode={mode}
          collectionByCardId={collectionByCardId}
          wantedByCardId={wantedByCardId}
          onCardLongPress={(card) => handleLongPress(card)}
          checklistMode={checklistMode}
          checklistSelections={checklistSelections}
          onCheckToggle={handleCheckToggle}
        />
      </View>

      {/* Checklist bottom bar */}
      {checklistMode && (
        <View style={styles.checklistBottom}>
          <Pressable style={styles.cancelBtn} onPress={exitChecklistMode}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.saveBtn} onPress={handleSaveChecklist}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>
      )}

      <CardDetailModal
        visible={detailVisible}
        cards={displayCards}
        initialIndex={detailIndex}
        setName={isSearchMode ? undefined : currentSetName}
        onClose={() => setDetailVisible(false)}
        mode={mode}
        collectionQuantity={(cardId) => collectionByCardId[cardId] ?? 0}
        wantedPriority={(cardId) => wantedByCardId[cardId]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  grid: {
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  checklistToggleRow: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  checklistBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  checklistBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  checklistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  checklistAction: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  checklistCount: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  checklistBottom: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.background,
  },
});
