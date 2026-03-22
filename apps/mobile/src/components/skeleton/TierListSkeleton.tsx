import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { spacing } from '@/src/constants/theme';

const ROW_COUNT = 3;

/**
 * Skeleton for Tier list items -- 3 rows with name text, tier pill boxes,
 * and footer text.
 * Matches loading state of tier list items.
 */
export function TierListSkeleton() {
  return (
    <Shimmer>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <View key={index}>
          <View style={styles.row}>
            <ShimmerText width="55%" />
            <View style={styles.pillRow}>
              <ShimmerBox width={28} height={20} />
              <ShimmerBox width={28} height={20} />
              <ShimmerBox width={28} height={20} />
              <ShimmerBox width={28} height={20} />
            </View>
            <ShimmerText width="35%" style={{ marginTop: spacing.xs }} />
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    height: 88,
    justifyContent: 'center',
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2a2a45',
    marginHorizontal: spacing.md,
  },
});
