import { View, Text, Pressable, StyleSheet } from 'react-native';
import { XCircle } from 'phosphor-react-native';
import { colors, typography, spacing, borderRadius } from '@/src/constants/theme';

const TIER_COLORS: Record<string, string> = {
  S: '#e74c3c',
  A: '#e67e22',
  B: '#f1c40f',
  C: '#2ecc71',
  D: '#3498db',
};

interface TierRowProps {
  tier: string;
  items: Array<{ id: string; name: string }>;
  onRemoveItem: (id: string) => void;
}

export function TierRow({ tier, items, onRemoveItem }: TierRowProps) {
  const tierColor = TIER_COLORS[tier] || colors.textMuted;

  return (
    <View style={styles.row}>
      <View style={[styles.tierLabel, { backgroundColor: tierColor }]}>
        <Text style={styles.tierText}>{tier}</Text>
      </View>
      <View style={styles.itemsContainer}>
        {items.length === 0 ? (
          <Text style={styles.emptyHint}>Drop decks here</Text>
        ) : (
          items.map((item) => (
            <Pressable key={item.id} style={styles.chip} onLongPress={() => onRemoveItem(item.id)}>
              <Text style={styles.chipText} numberOfLines={1}>
                {item.name}
              </Text>
              <Pressable
                onPress={() => onRemoveItem(item.id)}
                hitSlop={8}
                style={styles.removeButton}
              >
                <XCircle size={14} color={colors.textMuted} weight="fill" />
              </Pressable>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    minHeight: 52,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tierLabel: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  itemsContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    gap: spacing.xs,
    alignItems: 'center',
    minHeight: 44,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    maxWidth: 120,
  },
  removeButton: {
    marginLeft: 2,
  },
});
