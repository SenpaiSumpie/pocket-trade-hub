import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerCircle } from '@/src/components/animation/ShimmerCircle';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { spacing } from '@/src/constants/theme';

const ROW_COUNT = 3;
// Divider left offset: paddingHorizontal(16) + avatar(40) + cardPreview(8+32) + marginLeft(8) = 104
const DIVIDER_LEFT = spacing.md + 40 + spacing.sm + 32 + spacing.sm;

/**
 * Skeleton for Proposal list — 3 rows with avatar circle, card preview box,
 * and two text lines. Matches loading state of proposal list items.
 */
export function ProposalListSkeleton() {
  return (
    <Shimmer>
      {Array.from({ length: ROW_COUNT }).map((_, index) => (
        <View key={index}>
          <View style={styles.row}>
            <ShimmerCircle size={40} />
            <ShimmerBox
              width={32}
              height={44}
              style={{ marginLeft: spacing.sm, borderRadius: 4 }}
            />
            <View style={styles.textGroup}>
              <ShimmerText width="80%" />
              <ShimmerText width="50%" style={{ marginTop: spacing.xs }} />
            </View>
          </View>
          {index < ROW_COUNT - 1 && (
            <View style={[styles.divider, { marginLeft: DIVIDER_LEFT }]} />
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
    paddingVertical: spacing.md,
    height: 88,
  },
  textGroup: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2a2a45',
    marginRight: spacing.md,
  },
});
