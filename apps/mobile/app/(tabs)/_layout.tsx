import { useEffect, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/theme';
import { useTradesStore } from '@/src/stores/trades';
import { apiFetch } from '@/src/hooks/useApi';
import { useAuthStore } from '@/src/stores/auth';
import { useMatchSocket } from '@/src/hooks/useMatchSocket';

export default function TabLayout() {
  const unseenCount = useTradesStore((s) => s.unseenCount);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const lastRefreshed = useTradesStore((s) => s.lastRefreshed);

  // Connect Socket.IO at the tab level so real-time events work on any tab
  useMatchSocket();

  // Fetch matches on login and whenever lastRefreshed is null (store was reset)
  useEffect(() => {
    if (!isLoggedIn) return;
    if (lastRefreshed !== null) return; // Already loaded
    (async () => {
      try {
        const data = await apiFetch<{ matches: any[]; unseenCount: number }>('/matches?sort=priority');
        useTradesStore.getState().setMatches(data.matches, data.unseenCount);
      } catch {
        // Non-critical
      }
    })();
  }, [isLoggedIn, lastRefreshed]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cards',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: 'Trades',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal" size={size} color={color} />
          ),
          tabBarBadge: unseenCount > 0 ? unseenCount : undefined,
          tabBarBadgeStyle: { backgroundColor: '#e53e3e', fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
