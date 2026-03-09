import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet as RNStyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import Toast, { BaseToastProps } from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/stores/auth';
import { useNotificationSetup } from '@/src/hooks/useNotifications';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

const toastConfig = {
  matchNotification: ({ text1, text2, onPress }: BaseToastProps) => (
    <TouchableOpacity
      style={toastStyles.container}
      onPress={() => {
        if (onPress) onPress();
        router.push('/(tabs)/trades');
      }}
      activeOpacity={0.8}
    >
      <View style={toastStyles.accent} />
      <Ionicons name="swap-horizontal" size={20} color="#f0c040" style={toastStyles.icon} />
      <View style={toastStyles.textContainer}>
        {text1 ? <Text style={toastStyles.title}>{text1}</Text> : null}
        {text2 ? <Text style={toastStyles.body}>{text2}</Text> : null}
      </View>
    </TouchableOpacity>
  ),
};

const toastStyles = RNStyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#f0c040',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  icon: {
    marginLeft: 8,
    marginRight: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  body: {
    fontSize: 12,
    color: '#a0a0b8',
    marginTop: 2,
  },
});

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
      <Toast config={toastConfig} />
    </>
  );
}
