import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { spacing, borderRadius } from '@/src/constants/theme';

const ROW_COUNT = 3;

/**
 * Skeleton for Market post list -- 3 rows with image box and two text lines.
 * Matches loading state of MarketPost list items.
 */
export function MarketPostSkeleton() {
  return (
    <Shimmer>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <View key={index}>
          <View style={styles.row}>
            <ShimmerBox width={72} height={72} borderRadius={borderRadius.md} />
            <View style={styles.textGroup}>
              <ShimmerText width="70%" />
              <ShimmerText width="45%" style={{ marginTop: spacing.sm }} />
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
    height: 88,
    gap: spacing.sm,
  },
  textGroup: {
    flex: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2a2a45',
    marginLeft: spacing.md + 72 + spacing.sm,
    marginRight: spacing.md,
  },
});
