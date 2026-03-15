import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  FlatList,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import { SearchBar } from '@/src/components/cards/SearchBar';
import { RarityBadge } from '@/src/components/cards/RarityBadge';
import { useMarketplace } from '@/src/hooks/useMarketplace';
import { useSets } from '@/src/hooks/useCards';
import type { CardSet } from '@pocket-trade-hub/shared';

const POST_TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Offering', value: 'offering' },
  { label: 'Seeking', value: 'seeking' },
];

const RARITY_OPTIONS = [
  'diamond1', 'diamond2', 'diamond3', 'diamond4',
  'star1', 'star2', 'star3', 'crown',
] as const;

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'it', label: 'IT' },
  { code: 'ja', label: 'JA' },
  { code: 'ko', label: 'KO' },
  { code: 'pt', label: 'PT' },
  { code: 'zh', label: 'ZH' },
];

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Relevant', value: 'relevant' },
];

type PickerType = 'set' | 'rarity' | 'language' | null;

export function MarketFilters() {
  const { filters, setFilter, refresh } = useMarketplace();
  const { sets } = useSets();
  const [searchText, setSearchText] = useState(filters.search || '');
  const [pickerOpen, setPickerOpen] = useState<PickerType>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText !== (filters.search || '')) {
        setFilter('search', searchText || undefined);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText, filters.search, setFilter]);

  // Refresh posts when filters change (except search, handled by debounce)
  useEffect(() => {
    refresh();
  }, [filters.type, filters.set, filters.rarity, filters.language, filters.sort, filters.search, refresh]);

  const getPickerOptions = useCallback((): { label: string; value: string; rarity?: string }[] => {
    switch (pickerOpen) {
      case 'set':
        return [
          { label: 'All Sets', value: '' },
          ...sets.map((s: CardSet) => ({ label: s.name, value: s.id })),
        ];
      case 'rarity':
        return [
          { label: 'All Rarities', value: '' },
          ...RARITY_OPTIONS.map((r) => ({ label: r, value: r, rarity: r })),
        ];
      case 'language':
        return [
          { label: 'All Languages', value: '' },
          ...LANGUAGE_OPTIONS.map((l) => ({ label: l.label, value: l.code })),
        ];
      default:
        return [];
    }
  }, [pickerOpen, sets]);

  const handlePickerSelect = useCallback(
    (value: string) => {
      if (pickerOpen) {
        setFilter(pickerOpen, value || undefined);
      }
      setPickerOpen(null);
    },
    [pickerOpen, setFilter],
  );

  const getPickerTitle = (): string => {
    switch (pickerOpen) {
      case 'set': return 'Select Set';
      case 'rarity': return 'Select Rarity';
      case 'language': return 'Select Language';
      default: return '';
    }
  };

  const activeType = filters.type || '';
  const setLabel = filters.set
    ? sets.find((s: CardSet) => s.id === filters.set)?.name || filters.set
    : null;
  const rarityLabel = filters.rarity || null;
  const languageLabel = filters.language?.toUpperCase() || null;

  return (
    <View>
      <SearchBar value={searchText} onChangeText={setSearchText} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {/* Post type toggle */}
        {POST_TYPE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.chip, activeType === opt.value && styles.chipActive]}
            onPress={() => setFilter('type', opt.value || undefined)}
          >
            <Text style={[styles.chipText, activeType === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}

        {/* Set filter */}
        <Pressable
          style={[styles.chip, !!setLabel && styles.chipActive]}
          onPress={() => setPickerOpen('set')}
        >
          <Text style={[styles.chipText, !!setLabel && styles.chipTextActive]}>
            {setLabel || 'Set'}
          </Text>
          {setLabel ? (
            <Pressable onPress={() => setFilter('set', undefined)} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          ) : (
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          )}
        </Pressable>

        {/* Rarity filter */}
        <Pressable
          style={[styles.chip, !!rarityLabel && styles.chipActive]}
          onPress={() => setPickerOpen('rarity')}
        >
          <Text style={[styles.chipText, !!rarityLabel && styles.chipTextActive]}>
            {rarityLabel || 'Rarity'}
          </Text>
          {rarityLabel ? (
            <Pressable onPress={() => setFilter('rarity', undefined)} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          ) : (
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          )}
        </Pressable>

        {/* Language filter */}
        <Pressable
          style={[styles.chip, !!languageLabel && styles.chipActive]}
          onPress={() => setPickerOpen('language')}
        >
          <Ionicons
            name="language-outline"
            size={14}
            color={languageLabel ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.chipText, !!languageLabel && styles.chipTextActive]}>
            {languageLabel || 'Language'}
          </Text>
          {languageLabel ? (
            <Pressable onPress={() => setFilter('language', undefined)} hitSlop={8} style={styles.closeBtn}>
              <Ionicons name="close" size={14} color={colors.primary} />
            </Pressable>
          ) : (
            <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
          )}
        </Pressable>

        {/* Sort toggle */}
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            style={[styles.chip, filters.sort === opt.value && styles.chipActive]}
            onPress={() => setFilter('sort', opt.value)}
          >
            <Text style={[styles.chipText, filters.sort === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Picker modal */}
      <Modal
        visible={!!pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{getPickerTitle()}</Text>
            <FlatList
              data={getPickerOptions()}
              keyExtractor={(item) => item.value || '__all__'}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => handlePickerSelect(item.value)}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.rarity && <RarityBadge rarity={item.rarity} />}
                  {(pickerOpen && filters[pickerOpen] === item.value) && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </Pressable>
              )}
              style={styles.optionList}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary + '25',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  closeBtn: {
    marginLeft: 2,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '60%',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  optionList: {
    paddingHorizontal: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
});
