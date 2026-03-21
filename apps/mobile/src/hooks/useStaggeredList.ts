import { useRef } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  useReducedMotion,
  SharedValue,
} from 'react-native-reanimated';
import {
  TIMING_FADE_IN,
  TIMING_STAGGER_DELAY,
  MAX_STAGGER_ITEMS,
} from '@/src/constants/springs';

/**
 * Staggered list entrance animation hook.
 *
 * - Fades in + translates items 12px upward with TIMING_STAGGER_DELAY (50ms) between each item
 * - Plays only on first mount (mount-once gate D-08) — does NOT replay on tab return
 * - Caps animated items at MAX_STAGGER_ITEMS (15); items beyond appear instantly
 * - Respects useReducedMotion: all items appear instantly with no animation
 *
 * Usage:
 *   const { onLayout, getItemStyle } = useStaggeredList(items.length);
 *   <View onLayout={onLayout}>
 *     {items.map((item, i) => (
 *       <Animated.View key={item.id} style={getItemStyle(i)}>...</Animated.View>
 *     ))}
 *   </View>
 */
export function useStaggeredList(itemCount: number) {
  const clampedCount = Math.min(itemCount, MAX_STAGGER_ITEMS);
  const reducedMotion = useReducedMotion();

  // Mount-once gate (D-08) — prevents replaying animation on tab return
  const hasAnimated = useRef(false);

  // Pre-allocate MAX_STAGGER_ITEMS shared values (stable hook count regardless of itemCount).
  // Items beyond clampedCount are ignored; items beyond MAX_STAGGER_ITEMS appear instantly via getItemStyle.
  const opacities: SharedValue<number>[] = [
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
    useSharedValue(reducedMotion ? 1 : 0),
  ];

  const translateYValues: SharedValue<number>[] = [
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
    useSharedValue(reducedMotion ? 0 : 12),
  ];

  // Pre-build animated styles for all MAX_STAGGER_ITEMS slots (stable hook count)
  const animatedStyles = [
    useAnimatedStyle(() => ({ opacity: opacities[0].value, transform: [{ translateY: translateYValues[0].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[1].value, transform: [{ translateY: translateYValues[1].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[2].value, transform: [{ translateY: translateYValues[2].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[3].value, transform: [{ translateY: translateYValues[3].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[4].value, transform: [{ translateY: translateYValues[4].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[5].value, transform: [{ translateY: translateYValues[5].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[6].value, transform: [{ translateY: translateYValues[6].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[7].value, transform: [{ translateY: translateYValues[7].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[8].value, transform: [{ translateY: translateYValues[8].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[9].value, transform: [{ translateY: translateYValues[9].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[10].value, transform: [{ translateY: translateYValues[10].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[11].value, transform: [{ translateY: translateYValues[11].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[12].value, transform: [{ translateY: translateYValues[12].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[13].value, transform: [{ translateY: translateYValues[13].value }] })),
    useAnimatedStyle(() => ({ opacity: opacities[14].value, transform: [{ translateY: translateYValues[14].value }] })),
  ];

  // Empty style for items beyond MAX_STAGGER_ITEMS — appear instantly
  const instantStyle = {};

  // onLayout triggers stagger animation on first mount only (mount-once gate D-08)
  const onLayout = () => {
    if (hasAnimated.current || reducedMotion) {
      return;
    }
    hasAnimated.current = true;

    for (let i = 0; i < clampedCount; i++) {
      const delay = i * TIMING_STAGGER_DELAY;
      opacities[i].value = withDelay(delay, withTiming(1, TIMING_FADE_IN));
      translateYValues[i].value = withDelay(delay, withTiming(0, TIMING_FADE_IN));
    }
  };

  // Returns the animated style for a given list index.
  // Items beyond MAX_STAGGER_ITEMS (15) appear instantly.
  const getItemStyle = (index: number) => {
    if (index >= MAX_STAGGER_ITEMS) {
      return instantStyle;
    }
    return animatedStyles[index];
  };

  return { onLayout, getItemStyle };
}
