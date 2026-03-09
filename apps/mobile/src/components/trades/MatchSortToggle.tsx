import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '@/src/constants/theme';
import type { MatchSort } from '@pocket-trade-hub/shared';

interface MatchSortToggleProps {
  sortBy: MatchSort;
  onSortChange: (sort: MatchSort) => void;
}

const SORT_OPTIONS: { value: MatchSort; label: string }[] = [
  { value: 'priority', label: 'Priority' },
  { value: 'cards', label: 'Most Cards' },
  { value: 'newest', label: 'Newest' },
];

export function MatchSortToggle({ sortBy, onSortChange }: MatchSortToggleProps) {
  return (
    <View style={styles.container}>
      {SORT_OPTIONS.map((option) => {
        const isActive = sortBy === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onSortChange(option.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  pillTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
});
