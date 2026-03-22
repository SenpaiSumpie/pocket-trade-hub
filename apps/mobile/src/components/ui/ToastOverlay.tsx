import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import {
  CheckCircle,
  XCircle,
  Info,
  Warning,
} from 'phosphor-react-native';
import { useToastStore, ToastVariant } from '@/src/stores/toast';
import { colors, spacing, borderRadius } from '@/src/constants/theme';

// Elevation from shared tokens — inlined for self-contained component
const elevationMedium = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 4,
};

interface VariantConfig {
  icon: React.ComponentType<{ size: number; weight: string; color: string }>;
  accentColor: string;
}

const VARIANT_CONFIG: Record<ToastVariant, VariantConfig> = {
  success: { icon: CheckCircle, accentColor: '#2ecc71' },
  error: { icon: XCircle, accentColor: '#e74c3c' },
  info: { icon: Info, accentColor: '#3498db' },
  warning: { icon: Warning, accentColor: '#e67e22' },
};

export function ToastOverlay() {
  const queue = useToastStore((s) => s.queue);
  const dismiss = useToastStore((s) => s.dismiss);

  const current = queue[0] ?? null;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function triggerDismiss(id: string) {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
    // Exit animation: fade out + slide down 8px
    opacity.value = withTiming(0, { duration: 200 });
    translateY.value = withTiming(8, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(dismiss)(id);
      }
    });
  }

  useEffect(() => {
    if (!current) return;

    // Reset shared values and enter animation
    opacity.value = 0;
    translateY.value = 16;
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200 });

    // Auto-dismiss after 3000ms
    dismissTimeoutRef.current = setTimeout(() => {
      triggerDismiss(current.id);
    }, 3000);

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const panGesture = Gesture.Pan().onUpdate((event) => {
    // Allow dragging down only
    if (event.translationY > 0) {
      translateY.value = event.translationY;
      // Fade slightly as user drags
      opacity.value = Math.max(0, 1 - event.translationY / 80);
    }
  }).onEnd((event) => {
    if (event.translationY > 40 && current) {
      runOnJS(triggerDismiss)(current.id);
    } else {
      // Snap back
      translateY.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(1, { duration: 200 });
    }
  });

  if (!current) {
    return null;
  }

  const config = VARIANT_CONFIG[current.variant];
  const IconComponent = config.icon;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <View
          style={[
            styles.toast,
            elevationMedium,
          ]}
        >
          {/* Left accent bar */}
          <View
            style={[
              styles.accentBar,
              { backgroundColor: config.accentColor },
            ]}
          />
          {/* Icon */}
          <IconComponent
            size={20}
            weight="fill"
            color={config.accentColor}
          />
          {/* Message */}
          <Text style={styles.message} numberOfLines={2}>
            {current.message}
          </Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  message: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.text,
    flex: 1,
    marginLeft: spacing.sm,
  },
});
