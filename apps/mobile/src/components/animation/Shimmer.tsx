import { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useShimmer } from '@/src/hooks/useShimmer';

// Shimmer base and highlight colors (D-16) — no gold accent
const SHIMMER_BASE = '#1a1a2e';
const SHIMMER_HIGHLIGHT = '#252540';

interface ShimmerProps {
  children: React.ReactNode;
  /** Optional fixed width; measured via onLayout if not provided */
  width?: number;
  /** Optional fixed height; measured via onLayout if not provided */
  height?: number;
}

/**
 * Gradient wrapper for shimmer skeleton loading.
 * Renders children (placeholder shapes) with an animated LinearGradient sweep overlay.
 * The gradient band is 40% of container width and sweeps left-to-right infinitely.
 * Container clips overflow so gradient never bleeds outside bounds.
 */
export function Shimmer({ children, width: propWidth, height: propHeight }: ShimmerProps) {
  const [containerWidth, setContainerWidth] = useState(propWidth ?? 0);
  const [containerHeight, setContainerHeight] = useState(propHeight ?? 0);

  const translateX = useShimmer(containerWidth);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  function handleLayout(event: LayoutChangeEvent) {
    if (!propWidth) {
      setContainerWidth(event.nativeEvent.layout.width);
    }
    if (!propHeight) {
      setContainerHeight(event.nativeEvent.layout.height);
    }
  }

  // Band width is 40% of container width for the highlight sweep
  const bandWidth = containerWidth * 0.4;

  return (
    <View
      style={[styles.container, { width: propWidth, height: propHeight }]}
      onLayout={handleLayout}
    >
      {/* Static placeholder shapes */}
      {children}

      {/* Animated gradient overlay — positioned absolutely over children */}
      {containerWidth > 0 && containerHeight > 0 && (
        <Animated.View
          style={[
            styles.overlay,
            { width: bandWidth, height: containerHeight },
            animatedStyle,
          ]}
          pointerEvents="none"
        >
          <Svg width={bandWidth} height={containerHeight}>
            <Defs>
              <LinearGradient id="shimmerGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={SHIMMER_BASE} stopOpacity="0" />
                <Stop offset="0.5" stopColor={SHIMMER_HIGHLIGHT} stopOpacity="1" />
                <Stop offset="1" stopColor={SHIMMER_BASE} stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={bandWidth} height={containerHeight} fill="url(#shimmerGrad)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
