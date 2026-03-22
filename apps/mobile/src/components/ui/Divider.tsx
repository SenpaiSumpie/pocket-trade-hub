import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing } from '@/src/constants/theme';

export interface DividerProps {
  spacing?: number;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ spacing: spacingProp, style }: DividerProps) {
  return (
    <View
      style={[
        styles.divider,
        { marginVertical: spacingProp ?? spacing.md },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
