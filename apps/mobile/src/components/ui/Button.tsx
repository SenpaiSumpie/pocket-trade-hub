import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, borderRadius, spacing, fontFamily } from '@/src/constants/theme';
import { useAnimatedPress } from '@/src/hooks/useAnimatedPress';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  Icon?: React.ComponentType<{ size: number; color: string; weight: string }>;
  style?: StyleProp<ViewStyle>;
}

const sizeHeights: Record<ButtonSize, number> = {
  sm: 32,
  md: 44,
  lg: 52,
};

const sizeBorderRadius: Record<ButtonSize, number> = {
  sm: borderRadius.sm,
  md: borderRadius.md,
  lg: borderRadius.md,
};

interface VariantStyle {
  backgroundColor: string;
  borderWidth?: number;
  borderColor?: string;
}

interface VariantTextColor {
  color: string;
}

const variantContainerStyles: Record<ButtonVariant, VariantStyle> = {
  primary: {
    backgroundColor: '#f0c040',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f0c040',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  destructive: {
    backgroundColor: '#e74c3c',
  },
};

const variantTextColors: Record<ButtonVariant, VariantTextColor> = {
  primary: { color: '#0c0c18' },
  secondary: { color: '#f0c040' },
  ghost: { color: colors.text },
  destructive: { color: '#ffffff' },
};

export function Button({
  onPress,
  label,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  Icon,
  style,
}: ButtonProps) {
  const { animatedStyle, pressHandlers } = useAnimatedPress({ haptic: true });

  const height = sizeHeights[size];
  const radius = sizeBorderRadius[size];
  const variantContainer = variantContainerStyles[variant];
  const textColor = variantTextColors[variant];

  return (
    <Animated.View
      style={[
        styles.container,
        { height, borderRadius: radius },
        variantContainer,
        disabled && styles.disabled,
        animatedStyle,
        style,
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        {...pressHandlers}
        style={styles.pressable}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor.color}
          />
        ) : (
          <>
            {Icon ? (
              <Icon size={16} color={textColor.color} weight="regular" />
            ) : null}
            <Text style={[styles.label, textColor]}>{label}</Text>
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  pressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
