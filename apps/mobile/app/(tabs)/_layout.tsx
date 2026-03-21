import { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@/src/constants/theme';
import { useTradesStore } from '@/src/stores/trades';
import { useNotificationStore } from '@/src/stores/notifications';
import { usePremiumStore } from '@/src/stores/premium';
import { fetchUnreadCount } from '@/src/hooks/useNotifications';
import { useAuthStore } from '@/src/stores/auth';
import { useMatchSocket } from '@/src/hooks/useMatchSocket';
import { NotificationBell } from '@/src/components/notifications/NotificationBell';
import { CustomTabBar } from '@/src/components/navigation/CustomTabBar';

export default function TabLayout() {
  const { t } = useTranslation();
  const pendingProposals = useTradesStore((s) => {
    try {
      return (s.proposals ?? []).filter((p) => p && p.status === 'pending').length;
    } catch {
      return 0;
    }
  });
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
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => <NotificationBell />,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="cards" options={{ title: t('tabs.cards') }} />
      <Tabs.Screen name="market" options={{ title: t('tabs.market') }} />
      <Tabs.Screen name="trades" options={{ title: t('tabs.trades'), headerShown: false }} />
      <Tabs.Screen name="meta" options={{ title: t('tabs.meta') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
