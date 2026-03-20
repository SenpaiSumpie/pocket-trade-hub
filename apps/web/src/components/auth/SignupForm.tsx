'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

const webSignupSchema = z
  .object({
    displayName: z.string().min(1, 'Display name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type WebSignupInput = z.infer<typeof webSignupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WebSignupInput>({
    resolver: zodResolver(webSignupSchema),
  });

  const onSubmit = async (data: WebSignupInput) => {
    setServerError('');
    try {
      await signup(data.email, data.password, data.displayName);
      router.push('/cards');
    } catch (err: unknown) {
      setServerError(
        err instanceof Error
          ? err.message
          : 'Signup failed. Please try again.',
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label
          htmlFor="displayName"
          className="mb-1 block text-sm text-text-muted"
        >
          Display Name
        </label>
        <input
          id="displayName"
          type="text"
          autoComplete="name"
          {...register('displayName')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder-text-muted focus:border-gold focus:outline-none"
          placeholder="Your display name"
        />
        {errors.displayName && (
          <p className="mt-1 text-sm text-red-400">
            {errors.displayName.message}
          </p>
        )}
      </div>

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
          <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
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
          autoComplete="new-password"
          {...register('password')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder-text-muted focus:border-gold focus:outline-none"
          placeholder="At least 8 characters"
        />
        {errors.password && (
          <p className="mt-1 text-sm text-red-400">
            {errors.password.message}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1 block text-sm text-text-muted"
        >
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register('confirmPassword')}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-text placeholder-text-muted focus:border-gold focus:outline-none"
          placeholder="Confirm your password"
        />
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-400">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md bg-red-900/30 px-3 py-2 text-sm text-red-400">
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
          'Sign Up'
        )}
      </button>

      <p className="text-center text-sm text-text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-gold hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
