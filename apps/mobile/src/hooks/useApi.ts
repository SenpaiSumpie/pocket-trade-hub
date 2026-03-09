import { useAuthStore } from '../stores/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const { accessToken, refreshToken, updateTokens, logout } = useAuthStore.getState();

  const headers: Record<string, string> = {
    ...(fetchOptions.body ? { 'Content-Type': 'application/json' } : {}),
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  // If 401 and we have a refresh token, try refreshing
  if (res.status === 401 && !skipAuth && refreshToken) {
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (refreshRes.ok) {
      const data = await refreshRes.json();
      await updateTokens(data.accessToken, data.refreshToken);

      // Retry original request with new token
      headers['Authorization'] = `Bearer ${data.accessToken}`;
      res = await fetch(`${API_URL}${path}`, {
        ...fetchOptions,
        headers,
      });
    } else {
      // Refresh failed, log out
      await logout();
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message = body.error || body.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return res.json();
}

/** Recompute matches on server and re-fetch to update store/badge. Non-blocking. */
export function refreshMatchesInBackground() {
  (async () => {
    try {
      await apiFetch('/matches/refresh', { method: 'POST' });
      const { useTradesStore } = await import('../stores/trades');
      const sort = useTradesStore.getState().sortBy;
      const data = await apiFetch<{ matches: any[]; unseenCount: number }>(`/matches?sort=${sort}`);
      useTradesStore.getState().setMatches(data.matches, data.unseenCount);
    } catch {
      // Non-critical
    }
  })();
}

export function useApi() {
  return { apiFetch };
}
