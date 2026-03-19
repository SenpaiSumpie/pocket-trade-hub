import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '@/src/constants/theme';
import { useTradesStore } from '@/src/stores/trades';
import { useNotificationStore } from '@/src/stores/notifications';
import { usePremiumStore } from '@/src/stores/premium';
import { fetchUnreadCount } from '@/src/hooks/useNotifications';
import { useAuthStore } from '@/src/stores/auth';
import { useMatchSocket } from '@/src/hooks/useMatchSocket';
import { NotificationBell } from '@/src/components/notifications/NotificationBell';

export default function TabLayout() {
  const { t } = useTranslation();
  const pendingProposals = useTradesStore((s) => {
    try {
      return (s.proposals ?? []).filter((p) => p && p.status === 'pending').length;
    } catch {
      return 0;
    }
  });
  const tradesBadge = pendingProposals;
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // Connect Socket.IO at the tab level so real-time events work on any tab
  useMatchSocket();

  // Fetch unread notification count and premium status on login
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchUnreadCount();
    usePremiumStore.getState().fetchStatus();
  }, [isLoggedIn]);

  // Reset notification and premium stores on logout
  useEffect(() => {
    if (!isLoggedIn) {
      useNotificationStore.getState().reset();
      usePremiumStore.getState().reset();
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
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: t('tabs.cards'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          title: t('tabs.market'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'storefront' : 'storefront-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="trades"
        options={{
          title: t('tabs.trades'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="swap-horizontal" size={size} color={color} />
          ),
          tabBarBadge: tradesBadge > 0 ? tradesBadge : undefined,
          tabBarBadgeStyle: { backgroundColor: '#e53e3e', fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
