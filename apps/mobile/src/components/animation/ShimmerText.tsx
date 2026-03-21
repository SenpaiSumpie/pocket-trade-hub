import { View, ViewStyle } from 'react-native';

interface ShimmerTextProps {
  /** Width of the text placeholder. Defaults to '100%' */
  width?: number | string;
  /** Number of text lines to render. Defaults to 1 */
  lines?: number;
  /** Font size determines line height (lineHeight = fontSize * 1.4). Defaults to 16 */
  fontSize?: number;
  /** Additional style overrides applied to the container */
  style?: ViewStyle;
}

/**
 * Text-line shimmer placeholder — renders one or more horizontal bars mimicking text.
 * The last line renders at 70% width for a natural paragraph appearance.
 * Render inside a <Shimmer> wrapper to animate the gradient sweep.
 * Uses #1a1a2e as base color matching the shimmer system (D-16).
 */
export function ShimmerText({
  width = '100%',
  lines = 1,
  fontSize = 16,
  style,
}: ShimmerTextProps) {
  const barHeight = fontSize * 0.6;
  const lineHeight = fontSize * 1.4;

  return (
    <View style={[{ width: width as number }, style]}>
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1 && lines > 1;
        return (
          <View
            key={index}
            style={{
              width: isLast ? '70%' : '100%',
              height: barHeight,
              borderRadius: 4,
              backgroundColor: '#1a1a2e',
              marginBottom: index < lines - 1 ? lineHeight - barHeight : 0,
            }}
          />
        );
      })}
    </View>
  );
}
