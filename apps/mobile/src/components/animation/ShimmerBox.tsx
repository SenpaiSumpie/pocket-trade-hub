import { View, ViewStyle } from 'react-native';

interface ShimmerBoxProps {
  /** Width of the placeholder. Defaults to '100%' */
  width?: number | string;
  /** Height of the placeholder. Defaults to 100 */
  height?: number;
  /** Border radius. Defaults to 12 (borderRadius.md) */
  borderRadius?: number;
  /** Additional style overrides */
  style?: ViewStyle;
}

/**
 * Rectangular shimmer placeholder shape.
 * Render inside a <Shimmer> wrapper to animate the gradient sweep.
 * Uses #1a1a2e as base color matching the shimmer system (D-16).
 */
export function ShimmerBox({
  width = '100%',
  height = 100,
  borderRadius = 12,
  style,
}: ShimmerBoxProps) {
  return (
    <View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: '#1a1a2e',
        },
        style,
      ]}
    />
  );
}
