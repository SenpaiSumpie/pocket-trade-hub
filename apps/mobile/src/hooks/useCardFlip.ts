import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  useReducedMotion,
} from 'react-native-reanimated';
import { SPRING_FLIP } from '@/src/constants/springs';

export function useCardFlip() {
  const rotation = useSharedValue(0); // 0 = front, 1 = back
  const isFlipped = useSharedValue(false);
  const reducedMotion = useReducedMotion();

  const flip = () => {
    const target = isFlipped.value ? 0 : 1;
    isFlipped.value = !isFlipped.value;
    if (reducedMotion) {
      rotation.value = target;
    } else {
      rotation.value = withSpring(target, SPRING_FLIP);
    }
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden' as const,
    };
  });

  return { flip, frontAnimatedStyle, backAnimatedStyle, isFlipped };
}
