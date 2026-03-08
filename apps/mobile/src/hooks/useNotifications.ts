import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from './useApi';
import { useAuthStore } from '../stores/auth';

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
