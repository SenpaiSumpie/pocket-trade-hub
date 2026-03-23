import {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useReducedMotion,
} from 'react-native-reanimated';

export const HEADER_HEIGHT = 280;

/**
 * Parallax scroll hook for full-screen card detail view.
 *
 * - Card art translates at 50% of scroll speed (D-09)
 * - Card art fades out as user scrolls through 60% of header height (D-09)
 * - Reduced-motion users see opacity fade only, no translateY (D-16)
 */
export function useParallaxHeader() {
  const scrollY = useSharedValue(0);
  const reducedMotion = useReducedMotion();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const imageStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT * 0.6],
      [1, 0],
      Extrapolation.CLAMP
    );

    if (reducedMotion) {
      // Reduced-motion: opacity fade only, no translateY parallax (D-16)
      return { opacity };
    }

    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, HEADER_HEIGHT],
            [0, -HEADER_HEIGHT * 0.5],
            Extrapolation.CLAMP
          ),
        },
      ],
      opacity,
    };
  });

  return { scrollHandler, imageStyle, scrollY, HEADER_HEIGHT };
}
