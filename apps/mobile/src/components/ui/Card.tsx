import React from 'react';
import { View, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { elevation } from '@pocket-trade-hub/shared';
import { colors, borderRadius, spacing } from '@/src/constants/theme';
import { useAnimatedPress } from '@/src/hooks/useAnimatedPress';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

function PressableCard({ children, onPress, style, padding }: Required<Pick<CardProps, 'onPress' | 'children'>> & Pick<CardProps, 'style' | 'padding'>) {
  const { animatedStyle, pressHandlers } = useAnimatedPress({ haptic: true });

  return (
    <Animated.View
      style={[
        styles.card,
        { padding: padding ?? spacing.md },
        animatedStyle,
        style,
      ]}
    >
      <Pressable onPress={onPress} {...pressHandlers} style={styles.pressable}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function Card({ children, onPress, style, padding }: CardProps) {
  if (onPress) {
    return (
      <PressableCard onPress={onPress} style={style} padding={padding}>
        {children}
      </PressableCard>
    );
  }

  return (
    <View style={[styles.card, { padding: padding ?? spacing.md }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...elevation.low,
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
  },
});
