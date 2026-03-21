import { useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { BellSlash } from 'phosphor-react-native';
import { useNotificationStore } from '@/src/stores/notifications';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/src/hooks/useNotifications';
import { NotificationItem } from '@/src/components/notifications/NotificationItem';
import { colors, spacing, typography } from '@/src/constants/theme';
import type { Notification } from '@pocket-trade-hub/shared';

export default function NotificationsScreen() {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const loading = useNotificationStore((s) => s.loading);
  const hasMore = useNotificationStore((s) => s.hasMore);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = useCallback(() => {
    fetchNotifications();
  }, []);

  const handleEndReached = useCallback(() => {
    if (loading || !hasMore || notifications.length === 0) return;
    const lastNotif = notifications[notifications.length - 1];
    if (lastNotif) {
      fetchNotifications(lastNotif.createdAt);
    }
  }, [loading, hasMore, notifications]);

  const handleNotificationPress = useCallback((notification: Notification) => {
    markNotificationRead(notification.id);

    const data = notification.data as { proposalId?: string; matchId?: string } | undefined;
    if (data?.proposalId || data?.matchId) {
      // Navigate to the trades tab where proposals/matches are visible
      router.push('/(tabs)/trades');
    }
  }, []);

  const handleMarkAllRead = useCallback(() => {
    markAllNotificationsRead();
  }, []);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BellSlash size={64} color={colors.textMuted} weight="regular" />
      <Text style={styles.emptyText}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        You will see trade proposals, matches, and ratings here
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () =>
            unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            ) : null,
        }}
      />
      <View style={styles.container}>
        {notifications.length === 0 && !loading ? (
          renderEmpty()
        ) : (
          <FlashList
            data={notifications}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={handleNotificationPress}
              />
            )}
            keyExtractor={(item) => item.id}
            onRefresh={handleRefresh}
            refreshing={loading}
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.5}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.subheading,
    color: colors.textMuted,
    marginTop: spacing.lg,
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  markAllButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  markAllText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
