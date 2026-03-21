import { useState } from 'react';
import { View, Pressable, Text, Modal, FlatList, StyleSheet } from 'react-native';
import { Globe, X, CaretDown, Check } from 'phosphor-react-native';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import { RarityBadge } from './RarityBadge';
import { useCardsStore } from '@/src/stores/cards';
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

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'EN (English)' },
  { code: 'de', label: 'DE (German)' },
  { code: 'es', label: 'ES (Spanish)' },
  { code: 'fr', label: 'FR (French)' },
  { code: 'it', label: 'IT (Italian)' },
  { code: 'ja', label: 'JA (Japanese)' },
  { code: 'ko', label: 'KO (Korean)' },
  { code: 'pt', label: 'PT (Portuguese)' },
  { code: 'zh', label: 'ZH (Chinese)' },
];

type FilterKey = keyof CardFilters;

export function FilterChips({ activeFilters, sets, onSetFilter, onRemoveFilter }: FilterChipsProps) {
  const [pickerOpen, setPickerOpen] = useState<FilterKey | 'language' | null>(null);
  const selectedLanguage = useCardsStore((s) => s.selectedLanguage);
  const setSelectedLanguage = useCardsStore((s) => s.setSelectedLanguage);

  const getOptions = (): { label: string; value: string; rarity?: string }[] => {
    switch (pickerOpen) {
      case 'set':
        return sets.map((s) => ({ label: s.name, value: s.id }));
      case 'rarity':
        return RARITY_OPTIONS.map((r) => ({ label: r, value: r, rarity: r }));
      case 'type':
        return TYPE_OPTIONS.map((t) => ({ label: t, value: t }));
      case 'language':
        return [
          { label: 'All Languages', value: '' },
          ...LANGUAGE_OPTIONS.map((l) => ({ label: l.label, value: l.code })),
        ];
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

  const languageLabel = selectedLanguage
    ? LANGUAGE_OPTIONS.find((l) => l.code === selectedLanguage)?.code.toUpperCase() ?? selectedLanguage.toUpperCase()
    : null;

  const handlePickerSelect = (value: string) => {
    if (pickerOpen === 'language') {
      setSelectedLanguage(value || undefined);
    } else if (pickerOpen) {
      onSetFilter(pickerOpen, value);
    }
    setPickerOpen(null);
  };

  const getPickerTitle = (): string => {
    if (pickerOpen === 'language') return 'Select Language';
    if (pickerOpen) return `Select ${pickerOpen.charAt(0).toUpperCase() + pickerOpen.slice(1)}`;
    return '';
  };

  const getActiveValue = (): string | undefined => {
    if (pickerOpen === 'language') return selectedLanguage;
    if (pickerOpen) return activeFilters[pickerOpen];
    return undefined;
  };

  return (
    <>
      <View style={styles.filterRow}>
        {/* Language filter chip */}
        <Pressable
          style={[styles.chip, !!languageLabel && styles.chipActive]}
          onPress={() => setPickerOpen('language')}
        >
          <Globe size={16} color={languageLabel ? colors.primary : colors.textSecondary} weight="regular" />
          <Text style={[styles.chipText, !!languageLabel && styles.chipTextActive]}>
            {languageLabel || 'Language'}
          </Text>
          {languageLabel ? (
            <Pressable
              onPress={() => setSelectedLanguage(undefined)}
              hitSlop={8}
              style={styles.closeBtn}
            >
              <X size={16} color={colors.primary} weight="regular" />
            </Pressable>
          ) : (
            <CaretDown size={16} color={colors.textSecondary} weight="regular" />
          )}
        </Pressable>

        {filterDefs.map(({ key, label }) => {
          const activeLabel = getActiveLabel(key);
          const isActive = !!activeLabel;

          return (
            <Pressable
              key={key}
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
                  <X size={16} color={colors.primary} weight="regular" />
                </Pressable>
              ) : (
                <CaretDown size={16} color={colors.textSecondary} weight="regular" />
              )}
            </Pressable>
          );
        })}
      </View>

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
              data={getOptions()}
              keyExtractor={(item) => item.value || '__all__'}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => handlePickerSelect(item.value)}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.rarity && <RarityBadge rarity={item.rarity} />}
                  {getActiveValue() === item.value && (
                    <Check size={18} color={colors.primary} weight="regular" />
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
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
    fontSize: 14,
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
