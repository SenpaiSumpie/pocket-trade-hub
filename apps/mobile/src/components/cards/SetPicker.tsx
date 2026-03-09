import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { CardSet } from '@pocket-trade-hub/shared';

interface SetPickerProps {
  sets: CardSet[];
  selectedSetId: string | null;
  onSelectSet: (setId: string) => void;
  progress?: Record<string, { owned: number; total: number }>;
}

export function SetPicker({ sets, selectedSetId, onSelectSet, progress: _progress }: SetPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {sets.map((set) => {
        const isSelected = set.id === selectedSetId;
        return (
          <Pressable
            key={set.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelectSet(set.id)}
          >
            <Text
              style={[styles.chipText, isSelected && styles.chipTextSelected]}
              numberOfLines={1}
            >
              {set.name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});
