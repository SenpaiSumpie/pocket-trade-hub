import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';
import { SPRING_TILT } from '@/src/constants/springs';

interface TiltGestureEvent {
  nativeEvent: { locationX: number; locationY: number };
}

export function useCardTilt() {
  const tiltX = useSharedValue(0); // rotateX
  const tiltY = useSharedValue(0); // rotateY
  const reducedMotion = useReducedMotion();
  const cardDimensions = useSharedValue({ width: 0, height: 0 });

  const onLayout = (event: { nativeEvent: { layout: { width: number; height: number } } }) => {
    cardDimensions.value = {
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    };
  };

  const onPressIn = (event: TiltGestureEvent) => {
    if (reducedMotion) return;
    const { locationX, locationY } = event.nativeEvent;
    const { width, height } = cardDimensions.value;
    if (width === 0 || height === 0) return;
    // Normalize to [-1, 1]
    const normalizedX = (locationX / width) * 2 - 1;
    const normalizedY = (locationY / height) * 2 - 1;
    // rotateX = -touchY * 3deg, rotateY = touchX * 3deg
    tiltX.value = withSpring(-normalizedY * 3, SPRING_TILT);
    tiltY.value = withSpring(normalizedX * 3, SPRING_TILT);
  };

  const onPressOut = () => {
    tiltX.value = withSpring(0, SPRING_TILT);
    tiltY.value = withSpring(0, SPRING_TILT);
  };

  const tiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));

  return { tiltStyle, tiltHandlers: { onPressIn, onPressOut }, onLayout };
}
