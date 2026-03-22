import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerCircle } from '@/src/components/animation/ShimmerCircle';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { spacing } from '@/src/constants/theme';

const ROW_COUNT = 3;

/**
 * Skeleton for Deck ranking list -- 3 rows with rank circle, deck image box,
 * name text, and two stat boxes.
 * Matches loading state of deck ranking list items.
 */
export function DeckRankingSkeleton() {
  return (
    <Shimmer>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <View key={index}>
          <View style={styles.row}>
            <ShimmerCircle size={32} />
            <ShimmerBox width={40} height={40} />
            <View style={styles.textGroup}>
              <ShimmerText width="60%" />
              <View style={styles.statRow}>
                <ShimmerBox width={40} height={16} />
                <ShimmerBox width={40} height={16} />
              </View>
            </View>
          </View>
          {index < ROW_COUNT - 1 && (
            <View style={styles.divider} />
          )}
        </View>
      ))}
    </Shimmer>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 72,
    gap: spacing.sm,
  },
  textGroup: {
    flex: 1,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2a2a45',
    marginHorizontal: spacing.md,
  },
});
