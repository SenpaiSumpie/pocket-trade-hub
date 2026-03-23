import { useEffect } from 'react';
import { View, Image, Text, Dimensions, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useReducedMotion,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { SPRING_CARD_APPEAR, TIMING_FADE_IN, TIMING_SHIMMER } from '@/src/constants/springs';
import { fontFamily } from '@/src/constants/theme';

interface SplashOverlayProps {
  onComplete: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHIMMER_BAND_WIDTH = SCREEN_WIDTH * 0.4;

export function SplashOverlay({ onComplete }: SplashOverlayProps) {
  const reducedMotion = useReducedMotion();

  const logoScale = useSharedValue(reducedMotion ? 1 : 0.8);
  const logoOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const nameOpacity = useSharedValue(reducedMotion ? 1 : 0);
  const overlayOpacity = useSharedValue(1);
  const shimmerX = useSharedValue(-SCREEN_WIDTH);

  useEffect(() => {
    // Native splash hides, React overlay with same background seamlessly takes over
    SplashScreen.hideAsync().catch(() => {});

    if (reducedMotion) {
      // Instant display, quick fade-out
      const timer = setTimeout(() => {
        overlayOpacity.value = withTiming(0, TIMING_FADE_IN, (finished) => {
          if (finished) {
            runOnJS(onComplete)();
          }
        });
      }, 100);
      return () => clearTimeout(timer);
    }

    // Full animation sequence
    // 1. Logo spring-in + fade in on mount
    logoScale.value = withSpring(1, SPRING_CARD_APPEAR);
    logoOpacity.value = withTiming(1, TIMING_FADE_IN);

    // 2. App name fades in at ~400ms
    const nameTimer = setTimeout(() => {
      nameOpacity.value = withTiming(1, TIMING_FADE_IN);
    }, 400);

    // 3. Gold shimmer sweeps once at ~600ms
    const shimmerTimer = setTimeout(() => {
      shimmerX.value = withTiming(SCREEN_WIDTH, TIMING_SHIMMER);
    }, 600);

    // 4. Overlay fades out at ~1500ms, calls onComplete when done
    const fadeTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, TIMING_FADE_IN, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      });
    }, 1500);

    return () => {
      clearTimeout(nameTimer);
      clearTimeout(shimmerTimer);
      clearTimeout(fadeTimer);
    };
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const nameAnimatedStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));

  return (
    <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
      {/* Logo */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <Image
          source={require('@/assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name */}
      <Animated.View style={nameAnimatedStyle}>
        <Text style={styles.appName}>Pocket Trade Hub</Text>
      </Animated.View>

      {/* Gold shimmer sweep — covers logo + name area, non-interactive */}
      {!reducedMotion && (
        <View style={styles.shimmerContainer} pointerEvents="none">
          <Animated.View
            style={[
              styles.shimmerBand,
              shimmerAnimatedStyle,
            ]}
            pointerEvents="none"
          >
            <Svg width={SHIMMER_BAND_WIDTH} height={240}>
              <Defs>
                <LinearGradient id="goldShimmerGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor="rgba(240,192,64,0)" stopOpacity="0" />
                  <Stop offset="0.5" stopColor="rgba(240,192,64,0.6)" stopOpacity="1" />
                  <Stop offset="1" stopColor="rgba(240,192,64,0)" stopOpacity="0" />
                </LinearGradient>
              </Defs>
              <Rect x="0" y="0" width={SHIMMER_BAND_WIDTH} height={240} fill="url(#goldShimmerGrad)" />
            </Svg>
          </Animated.View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0f0f1a',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    translateY: -24,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: fontFamily.bold,
    marginTop: 16,
    textAlign: 'center',
  },
  shimmerContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 240,
    marginTop: -120,
    overflow: 'hidden',
  },
  shimmerBand: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SHIMMER_BAND_WIDTH,
    height: 240,
  },
});
