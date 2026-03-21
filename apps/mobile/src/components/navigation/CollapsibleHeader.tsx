import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { NotificationBell } from '@/src/components/notifications/NotificationBell';
import { fontFamily } from '@/src/constants/theme';

interface CollapsibleHeaderProps {
  title: string;
  headerStyle: any;
  searchRowStyle: any;
  titleStyle: any;
  borderStyle: any;
  children?: React.ReactNode;
  showBell?: boolean;
}

export function CollapsibleHeader({
  title,
  headerStyle,
  searchRowStyle,
  titleStyle,
  borderStyle,
  children,
  showBell = true,
}: CollapsibleHeaderProps) {
  return (
    <Animated.View style={[styles.container, headerStyle, borderStyle]}>
      <View style={styles.titleRow}>
        <Animated.Text style={[styles.title, titleStyle]}>{title}</Animated.Text>
        {showBell && <NotificationBell />}
      </View>
      {children && (
        <Animated.View style={[styles.searchRow, searchRowStyle]}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0c0c18',
    height: 120,
    paddingHorizontal: 16,
    zIndex: 10,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  title: {
    color: '#ffffff',
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  searchRow: {
    paddingTop: 8,
  },
});
