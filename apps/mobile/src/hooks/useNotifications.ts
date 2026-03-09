import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from './useApi';
import { useAuthStore } from '../stores/auth';
import { useNotificationStore } from '../stores/notifications';
import type { Notification } from '@pocket-trade-hub/shared';

/**
 * Request push notification permissions and register the Expo push token
 * with the backend. Returns the token string or null if unavailable.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permissions if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Get the Expo push token
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: projectId ?? undefined,
  });
  const token = tokenData.data;

  // Register token with backend
  await apiFetch('/notifications/register-token', {
    method: 'POST',
    body: JSON.stringify({ token, platform: Platform.OS }),
  });

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}

/**
 * Hook that automatically registers for push notifications when the user
 * is authenticated. Fails silently since push is non-critical.
 */
export function useNotificationSetup() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (!isLoggedIn) return;

    registerForPushNotifications().catch(() => {
      // Push notifications are non-critical; fail silently
    });
  }, [isLoggedIn]);
}

// ---- Notification Inbox Hooks ----

interface NotificationsResponse {
  notifications: Notification[];
  hasMore: boolean;
}

interface UnreadCountResponse {
  count: number;
}

/**
 * Fetch the first page of notifications from the server.
 */
export async function fetchNotifications(cursor?: string): Promise<void> {
  const store = useNotificationStore.getState();
  store.setLoading(true);
  try {
    const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
    const data = await apiFetch<NotificationsResponse>(`/notifications${query}`);
    if (cursor) {
      store.appendNotifications(data.notifications, data.hasMore);
    } else {
      store.setNotifications(data.notifications, data.hasMore);
    }
  } catch {
    // Non-critical
  } finally {
    store.setLoading(false);
  }
}

/**
 * Fetch the unread notification count from the server.
 */
export async function fetchUnreadCount(): Promise<void> {
  try {
    const data = await apiFetch<UnreadCountResponse>('/notifications/unread-count');
    useNotificationStore.getState().setUnreadCount(data.count);
  } catch {
    // Non-critical
  }
}

/**
 * Mark a single notification as read (optimistic update).
 */
export async function markNotificationRead(id: string): Promise<void> {
  // Optimistic update
  useNotificationStore.getState().markRead(id);
  try {
    await apiFetch(`/notifications/${id}/read`, { method: 'PUT' });
  } catch {
    // Revert not critical for read status
  }
}

/**
 * Mark all notifications as read (optimistic update).
 */
export async function markAllNotificationsRead(): Promise<void> {
  // Optimistic update
  useNotificationStore.getState().markAllRead();
  try {
    await apiFetch('/notifications/read-all', { method: 'PUT' });
  } catch {
    // Revert not critical for read status
  }
}
