import { View, ViewStyle } from 'react-native';

interface ShimmerCircleProps {
  /** Diameter of the circle placeholder. Defaults to 48 */
  size?: number;
  /** Additional style overrides */
  style?: ViewStyle;
}

/**
 * Circular shimmer placeholder shape (e.g. for avatars).
 * Render inside a <Shimmer> wrapper to animate the gradient sweep.
 * Uses borderRadius: 9999 for a perfect circle and #1a1a2e base color (D-16).
 */
export function ShimmerCircle({ size = 48, style }: ShimmerCircleProps) {
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: 9999,
          backgroundColor: '#1a1a2e',
        },
        style,
      ]}
    />
  );
}
