import { useEffect, useRef } from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useReducedMotion,
} from 'react-native-reanimated';
import { TIMING_COUNTER } from '@/src/constants/springs';

interface AnimatedCounterProps {
  value: number;
  style?: TextStyle;
  formatFn?: (n: number) => string;
}

export function AnimatedCounter({ value, style, formatFn }: AnimatedCounterProps) {
  const reducedMotion = useReducedMotion();
  const prevValueRef = useRef(value);
  const progress = useSharedValue(1);

  const lineHeight = style?.lineHeight ?? (style?.fontSize ? style.fontSize * 1.4 : 22);
  const defaultFormat = (n: number) => n.toLocaleString();
  const format = formatFn ?? defaultFormat;

  const prevValue = prevValueRef.current;

  useEffect(() => {
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;

    if (reducedMotion) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withTiming(1, TIMING_COUNTER);
  }, [value, reducedMotion, progress]);

  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [{ translateY: -lineHeight * progress.value }],
  }));

  const incomingStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: lineHeight * (1 - progress.value) }],
  }));

  return (
    <View
      style={[styles.container, { height: lineHeight }]}
      accessibilityLiveRegion="polite"
    >
      <Animated.Text style={[style, styles.text, outgoingStyle]}>
        {format(prevValue)}
      </Animated.Text>
      <Animated.Text style={[style, styles.text, incomingStyle]}>
        {format(value)}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  text: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
