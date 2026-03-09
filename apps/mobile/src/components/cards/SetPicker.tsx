import { View, ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/src/constants/theme';
import type { CardSet } from '@pocket-trade-hub/shared';

interface SetPickerProps {
  sets: CardSet[];
  selectedSetId: string | null;
  onSelectSet: (setId: string) => void;
  progress?: Record<string, { owned: number; total: number }>;
}

export function SetPicker({ sets, selectedSetId, onSelectSet, progress }: SetPickerProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {sets.map((set) => {
        const isSelected = set.id === selectedSetId;
        const prog = progress?.[set.id];
        const percent = prog && prog.total > 0 ? prog.owned / prog.total : 0;

        return (
          <Pressable
            key={set.id}
            style={[styles.chip, isSelected && styles.chipSelected, prog && styles.chipWithProgress]}
            onPress={() => onSelectSet(set.id)}
          >
            <Text
              style={[styles.chipText, isSelected && styles.chipTextSelected]}
              numberOfLines={1}
            >
              {set.name}
            </Text>
            {prog && (
              <>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(percent * 100, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, isSelected && styles.progressTextSelected]}>
                  {prog.owned}/{prog.total}
                </Text>
              </>
            )}
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
  chipWithProgress: {
    paddingBottom: spacing.xs,
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
  progressTrack: {
    height: 3,
    backgroundColor: colors.surfaceLight,
    borderRadius: 1.5,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 1.5,
  },
  progressText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  progressTextSelected: {
    color: colors.primary,
  },
});
