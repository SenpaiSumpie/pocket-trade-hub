import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hapticPatterns } from '@/src/hooks/useHaptics';
import { useTradesStore } from '@/src/stores/trades';
import { TabBarIcon } from './TabBarIcon';
import { fontFamily } from '@/src/constants/theme';

export function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabWidth = width / state.routes.length;

  const pillPosition = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    pillPosition.value = withSpring(state.index * tabWidth, {
      damping: 20,
      stiffness: 200,
    });
  }, [state.index, tabWidth]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pillPosition.value }],
  }));

  const pendingCount = useTradesStore((s) => {
    try {
      return (s.proposals ?? []).filter((p) => p && p.status === 'pending')
        .length;
    } catch {
      return 0;
    }
  });

  return (
    <View style={[styles.container, { paddingBottom: bottom }]}>
      {/* Sliding pill indicator */}
      <Animated.View
        style={[styles.pill, pillStyle, { width: tabWidth - 8 }]}
      />

      {/* Tab buttons */}
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const label = options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            hapticPatterns.navigation();
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <TabBarIcon
              name={route.name}
              focused={isFocused}
              color={isFocused ? '#f0c040' : '#6c6c80'}
              size={24}
              hasBadge={route.name === 'trades' && pendingCount > 0}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#111122',
    borderTopWidth: 1,
    borderTopColor: '#2a2a45',
    height: 60,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pill: {
    position: 'absolute',
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(240, 192, 64, 0.15)',
    top: 12,
    marginLeft: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: '#6c6c80',
    fontFamily: fontFamily.regular,
  },
  labelActive: {
    color: '#f0c040',
    fontWeight: '600',
    fontFamily: fontFamily.semiBold,
  },
});
