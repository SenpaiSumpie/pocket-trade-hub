import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { spacing } from '@/src/constants/theme';

const CARD_COUNT = 9;

/**
 * Skeleton for CardGrid — 9 shimmer cards in a 3-column grid.
 * Matches the first visible page of CardGrid layout.
 */
export function CardGridSkeleton() {
  return (
    <Shimmer>
      <View style={styles.grid}>
        {Array.from({ length: CARD_COUNT }).map((_, index) => (
          <View key={index} style={styles.cell}>
            <ShimmerBox
              style={{ aspectRatio: 0.715, borderRadius: 8 }}
              height={undefined}
            />
            <ShimmerText width="80%" style={{ marginTop: spacing.xs }} />
            <ShimmerText width="50%" style={{ marginTop: 2 }} />
          </View>
        ))}
      </View>
    </Shimmer>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  cell: {
    width: '31.5%',
  },
});
