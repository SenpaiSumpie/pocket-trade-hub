'use client';

import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface OAuthUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  isPremium?: boolean;
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? '';

export default function GoogleSignIn() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s);
  const [error, setError] = useState('');

  if (!GOOGLE_CLIENT_ID) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-surface px-2 text-text-muted">or</span>
        </div>
      </div>

      {error && (
        <p className="mb-3 rounded-md bg-[color-mix(in_srgb,var(--color-error)_15%,transparent)] px-3 py-2 text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}

      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              setError('');
              try {
                const data = await apiFetch<{
                  user: OAuthUser;
                  needsLinking?: boolean;
                }>('/auth/oauth/google', {
                  method: 'POST',
                  body: JSON.stringify({
                    idToken: credentialResponse.credential,
                    provider: 'google',
                  }),
                });

                if (data.needsLinking) {
                  setError(
                    'An account with this email already exists. Please log in with your email and password first.',
                  );
                  return;
                }

                useAuthStore.setState({
                  user: data.user,
                  isLoggedIn: true,
                });
                router.push('/cards');
              } catch (err: unknown) {
                setError(
                  err instanceof Error
                    ? err.message
                    : 'Google sign-in failed. Please try again.',
                );
              }
            }}
            onError={() => {
              setError('Google sign-in failed. Please try again.');
            }}
            theme="filled_black"
            size="large"
            width="100%"
          />
        </div>
      </GoogleOAuthProvider>
    </div>
  );
}
