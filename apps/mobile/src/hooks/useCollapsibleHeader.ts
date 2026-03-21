import {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  withSpring,
  Extrapolation,
  cancelAnimation,
} from 'react-native-reanimated';

export const HEADER_MAX = 120;
export const HEADER_MIN = 50;
const COLLAPSE_DISTANCE = HEADER_MAX - HEADER_MIN; // 70
const SPRING_CONFIG = { damping: 20, stiffness: 200 };

export function useCollapsibleHeader() {
  const scrollY = useSharedValue(0);
  const prevScrollY = useSharedValue(0);
  const headerTranslateY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const currentY = event.contentOffset.y;
      const diff = currentY - prevScrollY.value;

      if (diff > 0 && currentY > 0) {
        // Scrolling down -- collapse header
        cancelAnimation(headerTranslateY);
        headerTranslateY.value = withSpring(
          Math.max(headerTranslateY.value - diff, -COLLAPSE_DISTANCE),
          SPRING_CONFIG,
        );
      } else if (diff < 0) {
        // Scrolling up -- expand header
        cancelAnimation(headerTranslateY);
        headerTranslateY.value = withSpring(0, SPRING_CONFIG);
      }

      prevScrollY.value = currentY;
      scrollY.value = currentY;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const searchRowStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      -headerTranslateY.value,
      [0, 40],
      [1, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const titleStyle = useAnimatedStyle(() => {
    const fontSize = interpolate(
      -headerTranslateY.value,
      [0, COLLAPSE_DISTANCE],
      [28, 20],
      Extrapolation.CLAMP,
    );
    return { fontSize };
  });

  const borderStyle = useAnimatedStyle(() => {
    const borderOpacity = interpolate(
      -headerTranslateY.value,
      [COLLAPSE_DISTANCE - 10, COLLAPSE_DISTANCE],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return {
      borderBottomWidth: 1,
      borderBottomColor: `rgba(42, 42, 69, ${borderOpacity})`,
    };
  });

  return {
    scrollHandler,
    headerStyle,
    searchRowStyle,
    titleStyle,
    borderStyle,
    scrollY,
    HEADER_MAX,
    HEADER_MIN,
  };
}
