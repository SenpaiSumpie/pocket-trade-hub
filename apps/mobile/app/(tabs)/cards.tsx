import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/src/components/cards/SearchBar';
import { SetPicker } from '@/src/components/cards/SetPicker';
import { FilterChips } from '@/src/components/cards/FilterChips';
import { CardGrid } from '@/src/components/cards/CardGrid';
import { CardDetailModal } from '@/src/components/cards/CardDetailModal';
import { useSets, useCardsBySet, useCardSearch } from '@/src/hooks/useCards';
import { useCardsStore } from '@/src/stores/cards';
import { colors } from '@/src/constants/theme';
import type { Card } from '@pocket-trade-hub/shared';

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

  const currentCards = isSearchMode ? searchResults : setCards;
  const currentLoading = isSearchMode ? searchLoading : setLoading;

  const handleCardPress = useCallback((card: Card, index: number) => {
    setDetailIndex(index);
    setDetailVisible(true);
  }, []);

  const handleRefresh = useCallback(() => {
    if (!isSearchMode) {
      refreshSet();
    }
  }, [isSearchMode, refreshSet]);

  // Find set name for detail modal
  const currentSetName = sets.find((s) => s.id === selectedSetId)?.name;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

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
        />
      )}

      <View style={styles.grid}>
        <CardGrid
          cards={currentCards}
          loading={currentLoading}
          hasMore={!isSearchMode ? hasMore : false}
          onLoadMore={!isSearchMode ? loadMore : undefined}
          onCardPress={handleCardPress}
          onRefresh={handleRefresh}
          refreshing={false}
          isSearchMode={isSearchMode}
          sets={sets}
        />
      </View>

      <CardDetailModal
        visible={detailVisible}
        cards={currentCards}
        initialIndex={detailIndex}
        setName={isSearchMode ? undefined : currentSetName}
        onClose={() => setDetailVisible(false)}
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
});
