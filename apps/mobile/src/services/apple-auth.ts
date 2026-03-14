import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

export function isAppleSignInAvailable(): boolean {
  return Platform.OS === 'ios';
}

export async function signInWithApple(): Promise<{
  idToken: string;
  email?: string;
} | null> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      throw new Error('No identity token returned from Apple Sign-In');
    }
    return {
      idToken: credential.identityToken,
      email: credential.email ?? undefined,
    };
  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') return null;
    throw e;
  }
}
