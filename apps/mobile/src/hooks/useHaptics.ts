import * as Haptics from 'expo-haptics';

/**
 * Worklet-compatible haptic pattern singleton.
 * Use via runOnJS(hapticPatterns.navigation)() inside Reanimated worklets.
 *
 * Four contextual levels per D-13:
 * - navigation (Light): tab switch, card tap, button press, layout toggle, scroll interactions
 * - success (Medium): trade accepted, card added to collection, proposal sent
 * - error (Heavy): validation failure, network error, rejected action
 * - destructive (notificationError): delete, cancel trade, remove card
 *
 * Per D-17: No reduced-motion gating — haptics remain active regardless of
 * accessibility settings.
 */
export const hapticPatterns = {
  navigation: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  success: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  error: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  destructive: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

/**
 * React hook wrapper around hapticPatterns for component-level usage.
 * For worklet usage (Reanimated), import hapticPatterns directly and use runOnJS.
 */
export function useHaptics() {
  return hapticPatterns;
}
