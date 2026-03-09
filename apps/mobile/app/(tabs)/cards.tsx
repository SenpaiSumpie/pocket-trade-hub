import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SearchBar } from '@/src/components/cards/SearchBar';
import { SetPicker } from '@/src/components/cards/SetPicker';
import { FilterChips } from '@/src/components/cards/FilterChips';
import { CardGrid } from '@/src/components/cards/CardGrid';
import { CardDetailModal } from '@/src/components/cards/CardDetailModal';
import { useSets, useCardsBySet, useCardSearch } from '@/src/hooks/useCards';
import { useCardsStore } from '@/src/stores/cards';
import { useCollectionStore } from '@/src/stores/collection';
import { useLoadCollection, useAddToCollection, useRemoveFromCollection, useUpdateQuantity, useBulkUpdateCollection } from '@/src/hooks/useCollection';
import { useLoadWanted, useAddToWanted, useRemoveFromWanted, useUpdatePriority } from '@/src/hooks/useWanted';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

type Mode = 'browse' | 'collection' | 'wanted';

const SEGMENTS: Array<{ key: Mode; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'browse', label: 'Browse', icon: 'grid-outline' },
  { key: 'collection', label: 'My Collection', icon: 'albums-outline' },
  { key: 'wanted', label: 'Wanted', icon: 'heart-outline' },
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
  const removeFromCollection = useRemoveFromCollection();
  const updateQuantity = useUpdateQuantity();
  const bulkUpdate = useBulkUpdateCollection();
  const addToWanted = useAddToWanted();
  const removeFromWanted = useRemoveFromWanted();
  const updatePriority = useUpdatePriority();

  // Set filter dropdown state ('' means All sets)
  const [setFilterId, setSetFilterId] = useState<string>('');
  const [showSetDropdown, setShowSetDropdown] = useState(false);

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

  // Multi-select mode state (replaces checklist)
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [multiSelectIds, setMultiSelectIds] = useState<Set<string>>(new Set());

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

  // Filter by set if set filter is active
  const filteredCards = useMemo(() => {
    if (setFilterId && !isSearchMode) {
      return displayCards.filter((c) => c.setId === setFilterId);
    }
    return displayCards;
  }, [displayCards, setFilterId, isSearchMode]);

  const handleCardPress = useCallback((card: Card, index: number) => {
    if (multiSelectMode) {
      setMultiSelectIds((prev) => {
        const next = new Set(prev);
        if (next.has(card.id)) {
          next.delete(card.id);
        } else {
          next.add(card.id);
        }
        return next;
      });
      return;
    }
    setDetailIndex(index);
    setDetailVisible(true);
  }, [multiSelectMode]);

  const handleRefresh = useCallback(() => {
    if (!isSearchMode) {
      refreshSet();
    }
  }, [isSearchMode, refreshSet]);

  const handleLongPress = useCallback(
    (card: Card) => {
      if (multiSelectMode) return;
      // Enter multi-select mode with this card as first selection
      setMultiSelectIds(new Set([card.id]));
      setMultiSelectMode(true);
    },
    [multiSelectMode],
  );

  // Multi-select action handlers
  const exitMultiSelect = useCallback(() => {
    setMultiSelectMode(false);
    setMultiSelectIds(new Set());
  }, []);

  const handleMultiSelectAddToCollection = useCallback(async () => {
    if (!selectedSetId) return;
    const additions = [...multiSelectIds].filter((id) => !(id in collectionByCardId));
    if (additions.length > 0) {
      await bulkUpdate(selectedSetId, additions, []);
    }
    exitMultiSelect();
  }, [selectedSetId, multiSelectIds, collectionByCardId, bulkUpdate, exitMultiSelect]);

  const handleMultiSelectAddToWanted = useCallback(async () => {
    for (const cardId of multiSelectIds) {
      if (!(cardId in wantedByCardId)) {
        await addToWanted(cardId);
      }
    }
    exitMultiSelect();
  }, [multiSelectIds, wantedByCardId, addToWanted, exitMultiSelect]);

  const handleMultiSelectRemove = useCallback(async () => {
    if (mode === 'collection') {
      if (!selectedSetId) return;
      const removals = [...multiSelectIds].filter((id) => id in collectionByCardId);
      if (removals.length > 0) {
        await bulkUpdate(selectedSetId, [], removals);
      }
    } else if (mode === 'wanted') {
      for (const cardId of multiSelectIds) {
        if (cardId in wantedByCardId) {
          await removeFromWanted(cardId);
        }
      }
    }
    exitMultiSelect();
  }, [mode, selectedSetId, multiSelectIds, collectionByCardId, wantedByCardId, bulkUpdate, removeFromWanted, exitMultiSelect]);

  // Mode switch handler
  const handleModeSwitch = useCallback(
    (newMode: Mode) => {
      if (multiSelectMode) exitMultiSelect();
      setMode(newMode);
    },
    [setMode, multiSelectMode, exitMultiSelect],
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

  // Set dropdown options
  const setOptions = useMemo(() => {
    return [{ id: '', name: 'All Sets' }, ...sets];
  }, [sets]);

  const selectedSetLabel = setFilterId
    ? sets.find((s) => s.id === setFilterId)?.name ?? 'All Sets'
    : 'All Sets';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tab bar with icons and dividers */}
      <View style={styles.tabBar}>
        {SEGMENTS.map((seg, i) => {
          const active = mode === seg.key;
          return (
            <View key={seg.key} style={styles.tabItemWrapper}>
              {i > 0 && <View style={styles.tabDivider} />}
              <Pressable
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => handleModeSwitch(seg.key)}
              >
                <Ionicons
                  name={active ? (seg.icon.replace('-outline', '') as keyof typeof Ionicons.glyphMap) : seg.icon}
                  size={18}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {seg.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Search bar */}
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Set filter dropdown */}
      {!isSearchMode && !setsLoading && (
        <View style={styles.setFilterRow}>
          <Pressable
            style={styles.setDropdownBtn}
            onPress={() => setShowSetDropdown(!showSetDropdown)}
          >
            <Ionicons name="layers-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.setDropdownLabel} numberOfLines={1}>
              {selectedSetLabel}
            </Text>
            <Ionicons
              name={showSetDropdown ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={colors.textMuted}
            />
          </Pressable>

          {/* Progress indicator for selected set */}
          {mode === 'collection' && setFilterId && progressForPicker?.[setFilterId] && (
            <View style={styles.setProgressInline}>
              <View style={styles.setProgressTrack}>
                <View
                  style={[
                    styles.setProgressFill,
                    {
                      width: `${Math.min(
                        ((progressForPicker[setFilterId].owned / progressForPicker[setFilterId].total) * 100),
                        100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.setProgressText}>
                {progressForPicker[setFilterId].owned}/{progressForPicker[setFilterId].total}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Set dropdown menu */}
      {showSetDropdown && !isSearchMode && (
        <View style={styles.setDropdownMenu}>
          {setOptions.map((opt) => {
            const isActive = opt.id === setFilterId;
            const prog = opt.id ? progressForPicker?.[opt.id] : undefined;
            return (
              <Pressable
                key={opt.id || '__all__'}
                style={[styles.setDropdownItem, isActive && styles.setDropdownItemActive]}
                onPress={() => {
                  setSetFilterId(opt.id);
                  if (opt.id) {
                    setSelectedSet(opt.id);
                  } else if (sets.length > 0) {
                    setSelectedSet(sets[0].id);
                  }
                  setShowSetDropdown(false);
                }}
              >
                <Text style={[styles.setDropdownItemText, isActive && styles.setDropdownItemTextActive]}>
                  {opt.name}
                </Text>
                {prog && (
                  <Text style={styles.setDropdownItemProgress}>
                    {prog.owned}/{prog.total}
                  </Text>
                )}
              </Pressable>
            );
          })}
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

      <View style={styles.grid}>
        <CardGrid
          cards={filteredCards}
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
          checklistMode={multiSelectMode}
          checklistSelections={multiSelectIds}
          onCheckToggle={(cardId) => {
            setMultiSelectIds((prev) => {
              const next = new Set(prev);
              if (next.has(cardId)) {
                next.delete(cardId);
              } else {
                next.add(cardId);
              }
              return next;
            });
          }}
        />
      </View>

      {/* Multi-select floating action bar */}
      {multiSelectMode && (
        <View style={styles.floatingBar}>
          <View style={styles.floatingBarInner}>
            <Text style={styles.floatingCount}>
              {multiSelectIds.size} selected
            </Text>
            <View style={styles.floatingActions}>
              {(mode === 'browse' || mode === 'collection') && (
                <Pressable
                  style={styles.floatingBtn}
                  onPress={handleMultiSelectAddToCollection}
                >
                  <Ionicons name="add-circle" size={20} color={colors.primary} />
                  <Text style={styles.floatingBtnText}>Collect</Text>
                </Pressable>
              )}
              {(mode === 'browse' || mode === 'wanted') && (
                <Pressable
                  style={styles.floatingBtn}
                  onPress={handleMultiSelectAddToWanted}
                >
                  <Ionicons name="heart" size={20} color={colors.primary} />
                  <Text style={styles.floatingBtnText}>Want</Text>
                </Pressable>
              )}
              {(mode === 'collection' || mode === 'wanted') && (
                <Pressable
                  style={[styles.floatingBtn, styles.floatingBtnDanger]}
                  onPress={handleMultiSelectRemove}
                >
                  <Ionicons name="trash" size={20} color={colors.error} />
                  <Text style={[styles.floatingBtnText, { color: colors.error }]}>Remove</Text>
                </Pressable>
              )}
              <Pressable style={styles.floatingBtnCancel} onPress={exitMultiSelect}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      <CardDetailModal
        visible={detailVisible}
        cards={filteredCards}
        initialIndex={detailIndex}
        setName={isSearchMode ? undefined : currentSetName}
        onClose={() => setDetailVisible(false)}
        mode={mode}
        collectionQuantity={(cardId) => collectionByCardId[cardId] ?? 0}
        wantedPriority={(cardId) => wantedByCardId[cardId]}
        onAddToCollection={(cardId) => addToCollection(cardId, 1)}
        onRemoveFromCollection={(cardId) => removeFromCollection(cardId)}
        onUpdateQuantity={(cardId, qty) => updateQuantity(cardId, qty)}
        onAddToWanted={(cardId) => addToWanted(cardId)}
        onRemoveFromWanted={(cardId) => removeFromWanted(cardId)}
        onUpdatePriority={(cardId, p) => updatePriority(cardId, p)}
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

  // Tab bar styles
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
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Set filter dropdown
  setFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  setDropdownBtn: {
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
  setDropdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    maxWidth: 150,
  },
  setDropdownMenu: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    maxHeight: 240,
    overflow: 'scroll' as any,
  },
  setDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  setDropdownItemActive: {
    backgroundColor: colors.primary + '18',
  },
  setDropdownItemText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '400',
    flex: 1,
  },
  setDropdownItemTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  setDropdownItemProgress: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  setProgressInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
  },
  setProgressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  setProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  setProgressText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // Floating action bar for multi-select
  floatingBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    paddingBottom: Platform.OS === 'web' ? spacing.md : spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: colors.background + 'EE',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  floatingBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  floatingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  floatingBtnDanger: {
    borderColor: colors.error + '40',
  },
  floatingBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  floatingBtnCancel: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
});
