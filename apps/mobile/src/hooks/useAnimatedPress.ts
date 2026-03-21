import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SPRING_PRESS } from '@/src/constants/springs';

function triggerHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function useAnimatedPress(options?: { haptic?: boolean }) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressHandlers = {
    onPressIn: () => {
      if (reducedMotion) {
        // Respect accessibility setting — skip animation, still allow haptic
        scale.value = 0.97;
      } else {
        scale.value = withSpring(0.97, SPRING_PRESS);
      }
      if (options?.haptic) {
        runOnJS(triggerHaptic)();
      }
    },
    onPressOut: () => {
      if (reducedMotion) {
        scale.value = 1;
      } else {
        scale.value = withSpring(1, SPRING_PRESS);
      }
    },
  };

  return { animatedStyle, pressHandlers };
}
