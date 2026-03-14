import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { useCollectionStore } from './collection';
import { useTradesStore } from './trades';
import { configureGoogleSignIn, signInWithGoogle, signOutGoogle } from '../services/google-auth';
import { signInWithApple } from '../services/apple-auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface User {
  id: string;
  email: string;
  displayName: string | null;
  avatarId: string | null;
  friendCode: string | null;
  preferredCardLanguage?: string;
  createdAt?: string;
}

interface NeedsLinking {
  email: string;
  provider: 'google' | 'apple';
  idToken: string;
}

interface OAuthResult {
  success: boolean;
  needsLinking?: boolean;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  needsLinking: NeedsLinking | null;
  linkedProviders: string[];
  login: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
  setUser: (user: User) => void;
  updateTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  loginWithGoogle: () => Promise<OAuthResult>;
  loginWithApple: () => Promise<OAuthResult>;
  linkAccount: (provider: string, idToken: string, password: string) => Promise<void>;
  setNeedsLinking: (data: NeedsLinking) => void;
  clearNeedsLinking: () => void;
  setLinkedProviders: (providers: string[]) => void;
}

async function secureGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function secureDelete(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

// Configure Google Sign-In on module load (non-web only)
if (Platform.OS !== 'web') {
  configureGoogleSignIn();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isLoggedIn: false,
  isHydrated: false,
  needsLinking: null,
  linkedProviders: [],

  login: async (accessToken, refreshToken, user) => {
    await secureSet('accessToken', accessToken);
    await secureSet('refreshToken', refreshToken);
    await secureSet('user', JSON.stringify(user));
    set({ accessToken, refreshToken, user, isLoggedIn: true });
  },

  logout: async () => {
    const { accessToken } = get();
    // Best-effort server logout
    try {
      if (accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      }
    } catch {
      // Ignore logout errors
    }
    // Sign out from Google if previously signed in
    await signOutGoogle();
    await secureDelete('accessToken');
    await secureDelete('refreshToken');
    await secureDelete('user');
    // Reset all data stores so next login starts fresh
    useCollectionStore.getState().reset();
    useTradesStore.getState().reset();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isLoggedIn: false,
      needsLinking: null,
      linkedProviders: [],
    });
  },

  hydrate: async () => {
    try {
      const accessToken = await secureGet('accessToken');
      const refreshToken = await secureGet('refreshToken');
      const userJson = await secureGet('user');

      if (!accessToken || !refreshToken) {
        set({ isHydrated: true });
        return;
      }

      // Try to fetch fresh user data
      let user: User | null = userJson ? JSON.parse(userJson) : null;

      try {
        const res = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          user = await res.json();
          await secureSet('user', JSON.stringify(user));
          set({ accessToken, refreshToken, user, isLoggedIn: true, isHydrated: true });
          return;
        }

        // Token expired - try refresh
        if (res.status === 401 && refreshToken) {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            await secureSet('accessToken', data.accessToken);
            await secureSet('refreshToken', data.refreshToken);

            // Fetch user with new token
            const userRes = await fetch(`${API_URL}/users/me`, {
              headers: { Authorization: `Bearer ${data.accessToken}` },
            });
            if (userRes.ok) {
              user = await userRes.json();
              await secureSet('user', JSON.stringify(user));
            }

            set({
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              user,
              isLoggedIn: true,
              isHydrated: true,
            });
            return;
          }
        }
      } catch {
        // Network error - use cached user data if available
        if (user) {
          set({ accessToken, refreshToken, user, isLoggedIn: true, isHydrated: true });
          return;
        }
      }

      // All attempts failed - clear tokens
      await secureDelete('accessToken');
      await secureDelete('refreshToken');
      await secureDelete('user');
      set({ isHydrated: true });
    } catch {
      set({ isHydrated: true });
    }
  },

  setUser: (user) => {
    secureSet('user', JSON.stringify(user)).catch(() => {});
    set({ user });
  },

  updateTokens: async (accessToken, refreshToken) => {
    await secureSet('accessToken', accessToken);
    await secureSet('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  loginWithGoogle: async (): Promise<OAuthResult> => {
    const idToken = await signInWithGoogle();
    if (!idToken) return { success: false };

    const res = await fetch(`${API_URL}/auth/oauth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'google', idToken }),
    });

    const data = await res.json();

    if (data.needsLinking) {
      set({
        needsLinking: {
          email: data.email,
          provider: 'google',
          idToken,
        },
      });
      return { success: false, needsLinking: true };
    }

    if (!res.ok) {
      throw new Error(data.error || 'Google sign-in failed');
    }

    await get().login(data.accessToken, data.refreshToken, data.user);
    return { success: true };
  },

  loginWithApple: async (): Promise<OAuthResult> => {
    const result = await signInWithApple();
    if (!result) return { success: false };

    const res = await fetch(`${API_URL}/auth/oauth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'apple', idToken: result.idToken }),
    });

    const data = await res.json();

    if (data.needsLinking) {
      set({
        needsLinking: {
          email: data.email,
          provider: 'apple',
          idToken: result.idToken,
        },
      });
      return { success: false, needsLinking: true };
    }

    if (!res.ok) {
      throw new Error(data.error || 'Apple sign-in failed');
    }

    await get().login(data.accessToken, data.refreshToken, data.user);
    return { success: true };
  },

  linkAccount: async (provider: string, idToken: string, password: string) => {
    const { accessToken } = get();
    if (!accessToken) throw new Error('Not authenticated');

    const res = await fetch(`${API_URL}/auth/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ provider, idToken, password }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to link account');
    }

    // After linking, retry the OAuth login to get tokens
    const oauthRes = await fetch(`${API_URL}/auth/oauth/${provider}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, idToken }),
    });

    const oauthData = await oauthRes.json();
    if (oauthRes.ok && oauthData.accessToken) {
      await get().login(oauthData.accessToken, oauthData.refreshToken, oauthData.user);
    }

    set({ needsLinking: null });
  },

  setNeedsLinking: (data: NeedsLinking) => set({ needsLinking: data }),
  clearNeedsLinking: () => set({ needsLinking: null }),
  setLinkedProviders: (providers: string[]) => set({ linkedProviders: providers }),
}));
