// Named animation presets — consumed by all animation hooks. Never use inline spring/timing configs.
import { Easing } from 'react-native-reanimated';

// Spring presets (for withSpring)
// SPRING_SNAPPY matches the existing { damping: 20, stiffness: 200 } from useCollapsibleHeader.ts
export const SPRING_SNAPPY = { damping: 20, stiffness: 200, mass: 1 };
export const SPRING_PRESS = { damping: 15, stiffness: 300, mass: 0.8 };
export const SPRING_CARD_APPEAR = { damping: 12, stiffness: 120, mass: 1 };
export const SPRING_FLIP = { damping: 18, stiffness: 160, mass: 1 };
export const SPRING_TILT = { damping: 14, stiffness: 250, mass: 0.8 };
export const SPRING_SHEET = { damping: 20, stiffness: 180, mass: 1 };

// Timing presets (for withTiming)
export const TIMING_COUNTER = { duration: 400, easing: Easing.out(Easing.quad) };
export const TIMING_SHIMMER = { duration: 1200, easing: Easing.linear };
export const TIMING_FADE_IN = { duration: 200, easing: Easing.out(Easing.quad) };
export const TIMING_STAGGER_DELAY = 50; // ms between staggered items
export const MAX_STAGGER_ITEMS = 15;
