'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@pocket-trade-hub/shared';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginForm() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError('');
    try {
      await login(data.email, data.password);
      router.push('/cards');
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : 'Login failed. Please try again.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-text-muted">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          {...register('email')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder-text-muted focus:border-gold focus:outline-none"
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-[var(--color-error)]">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm text-text-muted"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder-text-muted focus:border-gold focus:outline-none"
          placeholder="Enter your password"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-[var(--color-error)]">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md bg-[color-mix(in_srgb,var(--color-error)_15%,transparent)] px-3 py-2 text-sm text-[var(--color-error)]">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center rounded-lg bg-gold px-4 py-2 font-semibold text-bg transition-colors hover:bg-gold-hover disabled:opacity-50"
      >
        {isSubmitting ? (
          <svg
            className="h-5 w-5 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          'Log In'
        )}
      </button>

      <p className="text-center text-sm text-text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-gold hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
