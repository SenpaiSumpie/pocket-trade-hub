import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, borderRadius, spacing, fontFamily } from '@/src/constants/theme';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'rarity-diamond'
  | 'rarity-star'
  | 'rarity-crown'
  | 'premium';

export interface BadgeProps {
  variant?: BadgeVariant;
  label: string;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
}

interface VariantColors {
  backgroundColor: string;
  textColor: string;
}

const variantMap: Record<BadgeVariant, VariantColors> = {
  default: {
    backgroundColor: colors.surfaceLight,
    textColor: colors.text,
  },
  success: {
    backgroundColor: 'rgba(46, 204, 113, 0.2)',
    textColor: '#2ecc71',
  },
  warning: {
    backgroundColor: 'rgba(230, 126, 34, 0.2)',
    textColor: '#e67e22',
  },
  error: {
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    textColor: '#e74c3c',
  },
  'rarity-diamond': {
    backgroundColor: 'rgba(126, 200, 227, 0.15)',
    textColor: '#7ec8e3',
  },
  'rarity-star': {
    backgroundColor: 'rgba(240, 192, 64, 0.15)',
    textColor: '#f0c040',
  },
  'rarity-crown': {
    backgroundColor: 'rgba(232, 180, 248, 0.15)',
    textColor: '#e8b4f8',
  },
  premium: {
    backgroundColor: '#f0c040',
    textColor: '#0c0c18',
  },
};

export function Badge({ variant = 'default', label, style, textColor: textColorOverride }: BadgeProps) {
  const { backgroundColor, textColor } = variantMap[variant];
  const finalTextColor = textColorOverride ?? textColor;

  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      <Text style={[styles.label, { color: finalTextColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    fontFamily: fontFamily.regular,
  },
});
