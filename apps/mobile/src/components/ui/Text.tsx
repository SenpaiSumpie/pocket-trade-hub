import React from 'react';
import { Text as RNText, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { colors, fontFamily, fontWeight } from '@/src/constants/theme';

export type TextPreset = 'heading' | 'subheading' | 'body' | 'label';

export interface TextProps {
  preset?: TextPreset;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: React.ReactNode;
  numberOfLines?: number;
}

const presetStyles: Record<TextPreset, TextStyle> = {
  heading: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: colors.text,
    fontFamily: fontFamily.bold,
  },
  subheading: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    color: colors.text,
    fontFamily: fontFamily.bold,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: colors.text,
    fontFamily: fontFamily.regular,
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
    color: colors.textSecondary,
    fontFamily: fontFamily.regular,
  },
};

export function Text({ preset = 'body', color, style, children, numberOfLines }: TextProps) {
  const baseStyle = presetStyles[preset];
  const colorOverride = color ? { color } : undefined;

  return (
    <RNText
      style={[baseStyle, colorOverride, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </RNText>
  );
}
