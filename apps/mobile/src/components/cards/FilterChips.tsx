import { useState } from 'react';
import { View, ScrollView, Pressable, Text, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import { RarityBadge } from './RarityBadge';
import type { CardSet } from '@pocket-trade-hub/shared';

interface CardFilters {
  set?: string;
  rarity?: string;
  type?: string;
}

interface FilterChipsProps {
  activeFilters: CardFilters;
  sets: CardSet[];
  onSetFilter: (key: keyof CardFilters, value: string) => void;
  onRemoveFilter: (key: keyof CardFilters) => void;
}

const RARITY_OPTIONS = [
  'diamond1', 'diamond2', 'diamond3', 'diamond4',
  'star1', 'star2', 'star3', 'crown',
] as const;

const TYPE_OPTIONS = [
  'Fire', 'Water', 'Grass', 'Lightning', 'Psychic',
  'Fighting', 'Darkness', 'Metal', 'Dragon', 'Colorless', 'Normal',
];

type FilterKey = keyof CardFilters;

export function FilterChips({ activeFilters, sets, onSetFilter, onRemoveFilter }: FilterChipsProps) {
  const [pickerOpen, setPickerOpen] = useState<FilterKey | null>(null);

  const getOptions = (): { label: string; value: string; rarity?: string }[] => {
    switch (pickerOpen) {
      case 'set':
        return sets.map((s) => ({ label: s.name, value: s.id }));
      case 'rarity':
        return RARITY_OPTIONS.map((r) => ({ label: r, value: r, rarity: r }));
      case 'type':
        return TYPE_OPTIONS.map((t) => ({ label: t, value: t }));
      default:
        return [];
    }
  };

  const getActiveLabel = (key: FilterKey): string | null => {
    const val = activeFilters[key];
    if (!val) return null;
    if (key === 'set') {
      return sets.find((s) => s.id === val)?.name || val;
    }
    return val;
  };

  const filterDefs: { key: FilterKey; label: string }[] = [
    { key: 'set', label: 'Set' },
    { key: 'rarity', label: 'Rarity' },
    { key: 'type', label: 'Type' },
  ];

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {filterDefs.map(({ key, label }) => {
          const activeLabel = getActiveLabel(key);
          const isActive = !!activeLabel;

          return (
            <View key={key} style={styles.chipWrapper}>
              <Pressable
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setPickerOpen(key)}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {isActive ? activeLabel : label}
                </Text>
                {isActive ? (
                  <Pressable
                    onPress={() => onRemoveFilter(key)}
                    hitSlop={8}
                    style={styles.closeBtn}
                  >
                    <Ionicons name="close" size={14} color={colors.primary} />
                  </Pressable>
                ) : (
                  <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                )}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={!!pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setPickerOpen(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              Select {pickerOpen ? pickerOpen.charAt(0).toUpperCase() + pickerOpen.slice(1) : ''}
            </Text>
            <FlatList
              data={getOptions()}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onSetFilter(pickerOpen!, item.value);
                    setPickerOpen(null);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.rarity && <RarityBadge rarity={item.rarity} />}
                  {activeFilters[pickerOpen!] === item.value && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </Pressable>
              )}
              style={styles.optionList}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chipWrapper: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
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
