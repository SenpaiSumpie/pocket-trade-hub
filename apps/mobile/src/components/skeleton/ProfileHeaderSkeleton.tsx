import { View, StyleSheet } from 'react-native';
import { Shimmer } from '@/src/components/animation/Shimmer';
import { ShimmerBox } from '@/src/components/animation/ShimmerBox';
import { ShimmerCircle } from '@/src/components/animation/ShimmerCircle';
import { ShimmerText } from '@/src/components/animation/ShimmerText';
import { spacing } from '@/src/constants/theme';

/**
 * Skeleton for Profile header -- centered avatar circle, name text,
 * and badge box.
 * Matches loading state of profile header section.
 */
export function ProfileHeaderSkeleton() {
  return (
    <Shimmer>
      <View style={styles.container}>
        <ShimmerCircle size={80} />
        <ShimmerText width="50%" style={styles.name} />
        <ShimmerBox width={60} height={20} style={styles.badge} />
      </View>
    </Shimmer>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  name: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  badge: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
});
