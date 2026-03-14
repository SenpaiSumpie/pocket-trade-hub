import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/src/stores/auth';
import { isAppleSignInAvailable } from '@/src/services/apple-auth';
import { colors, spacing, borderRadius } from '@/src/constants/theme';

export function OAuthButtons() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginWithApple = useAuthStore((s) => s.loginWithApple);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.needsLinking) {
        // LinkAccountModal will handle this via needsLinking state
        return;
      }
      if (!result.success) {
        // User cancelled -- do nothing
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Google Sign-In Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleApple = async () => {
    setAppleLoading(true);
    try {
      const result = await loginWithApple();
      if (result.needsLinking) {
        return;
      }
      if (!result.success) {
        // User cancelled
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Apple Sign-In Failed',
        text2: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setAppleLoading(false);
    }
  };

  const showApple = isAppleSignInAvailable();

  return (
    <View style={styles.container}>
      {/* Divider */}
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Button */}
      <TouchableOpacity
        style={[styles.googleButton, googleLoading && styles.buttonDisabled]}
        onPress={handleGoogle}
        disabled={googleLoading || appleLoading}
      >
        {googleLoading ? (
          <ActivityIndicator color="#333" />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#333" />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Apple Button (iOS only) */}
      {showApple && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
          cornerRadius={borderRadius.md}
          style={styles.appleButton}
          onPress={handleApple}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '600',
  },
  appleButton: {
    height: 50,
    width: '100%',
  },
});
