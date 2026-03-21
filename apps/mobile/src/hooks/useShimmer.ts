import { useEffect } from 'react';
import {
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
  useReducedMotion,
} from 'react-native-reanimated';
import { TIMING_SHIMMER } from '@/src/constants/springs';

/**
 * Shared shimmer animation driver.
 * Drives an infinite left-to-right translateX sweep at 1200ms per cycle.
 * Respects reduced motion — returns static value when accessibility setting is on.
 * Cancels animation on unmount to prevent memory leaks.
 */
export function useShimmer(width: number) {
  const translateX = useSharedValue(-width);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      // Static placeholder — no sweep animation
      translateX.value = -width;
      return;
    }

    translateX.value = -width;
    translateX.value = withRepeat(
      withTiming(width, TIMING_SHIMMER),
      -1,   // infinite
      false // no reverse (left-to-right only)
    );

    return () => {
      cancelAnimation(translateX);
    };
  }, [width, reducedMotion]);

  return translateX;
}
