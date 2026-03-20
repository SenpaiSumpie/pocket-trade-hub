'use client';

import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isPremium?: boolean;
}

interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isHydrated: false,

  login: async (email, password) => {
    const data = await apiFetch<{ user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    set({ user: data.user, isLoggedIn: true });
  },

  signup: async (email, password, displayName) => {
    const data = await apiFetch<{ user: User }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    set({ user: data.user, isLoggedIn: true });
  },

  logout: async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Continue logout even if API call fails
    }
    set({ user: null, isLoggedIn: false });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  hydrate: async () => {
    try {
      const data = await apiFetch<{ user: User }>('/users/me');
      set({ user: data.user, isLoggedIn: true, isHydrated: true });
    } catch {
      set({ user: null, isLoggedIn: false, isHydrated: true });
    }
  },
}));
