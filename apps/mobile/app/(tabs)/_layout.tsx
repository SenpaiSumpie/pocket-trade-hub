import { useEffect, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/constants/theme';
import { useTradesStore } from '@/src/stores/trades';
import { useNotificationStore } from '@/src/stores/notifications';
import { apiFetch } from '@/src/hooks/useApi';
import { fetchUnreadCount } from '@/src/hooks/useNotifications';
import { useAuthStore } from '@/src/stores/auth';
import { useMatchSocket } from '@/src/hooks/useMatchSocket';
import { NotificationBell } from '@/src/components/notifications/NotificationBell';

export default function TabLayout() {
  const unseenCount = useTradesStore((s) => s.unseenCount);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const lastRefreshed = useTradesStore((s) => s.lastRefreshed);

  // Connect Socket.IO at the tab level so real-time events work on any tab
  useMatchSocket();

  // Fetch matches and unread notification count on login
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
    // Also fetch unread notification count
    fetchUnreadCount();
  }, [isLoggedIn, lastRefreshed]);

  // Reset notification store on logout
  useEffect(() => {
    if (!isLoggedIn) {
      useNotificationStore.getState().reset();
    }
  }, [isLoggedIn]);

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
        headerRight: () => <NotificationBell />,
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
