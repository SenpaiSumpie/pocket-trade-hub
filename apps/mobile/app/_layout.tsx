import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/src/stores/auth';
import { useNotificationSetup } from '@/src/hooks/useNotifications';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

// Configure foreground notification display
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  // Register for push notifications when authenticated
  useNotificationSetup();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated) {
      SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  if (!isHydrated) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isLoggedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isLoggedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="onboarding"
            options={{ presentation: 'modal', gestureEnabled: false }}
          />
          <Stack.Screen
            name="edit-profile"
            options={{
              headerShown: true,
              headerTitle: 'Edit Profile',
              headerStyle: { backgroundColor: '#0f0f1a' },
              headerTintColor: '#ffffff',
            }}
          />
          <Stack.Screen
            name="user/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Profile',
              headerStyle: { backgroundColor: '#0f0f1a' },
              headerTintColor: '#ffffff',
            }}
          />
        </Stack.Protected>
      </Stack>
      <Toast />
    </>
  );
}
