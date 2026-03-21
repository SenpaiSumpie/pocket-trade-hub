import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  House,
  Stack,
  Storefront,
  ArrowsLeftRight,
  Trophy,
  User,
} from 'phosphor-react-native';

const TAB_ICONS: Record<string, React.ComponentType<any>> = {
  index: House,
  cards: Stack,
  market: Storefront,
  trades: ArrowsLeftRight,
  meta: Trophy,
  profile: User,
};

interface TabBarIconProps {
  name: string;
  focused: boolean;
  color: string;
  size?: number;
  hasBadge?: boolean;
}

export function TabBarIcon({
  name,
  focused,
  color,
  size = 24,
  hasBadge = false,
}: TabBarIconProps) {
  const IconComponent = TAB_ICONS[name];

  if (!IconComponent) {
    return null;
  }

  return (
    <View style={styles.wrapper}>
      <IconComponent
        weight={focused ? 'fill' : 'regular'}
        size={size}
        color={color}
      />
      {hasBadge && <View style={styles.badge} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f0c040',
  },
});
