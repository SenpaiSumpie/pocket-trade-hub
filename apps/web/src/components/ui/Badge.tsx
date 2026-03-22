'use client';

import { type ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'rarity-diamond'
  | 'rarity-star'
  | 'rarity-crown'
  | 'premium';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-surface-light)] text-[var(--color-on-surface)]',
  success: 'bg-[rgba(46,204,113,0.2)] text-[var(--color-success)]',
  warning: 'bg-[rgba(230,126,34,0.2)] text-[var(--color-warning)]',
  error: 'bg-[rgba(231,76,60,0.2)] text-[var(--color-error)]',
  'rarity-diamond': 'bg-[rgba(126,200,227,0.15)] text-[var(--color-rarity-diamond)]',
  'rarity-star': 'bg-[rgba(240,192,64,0.15)] text-[var(--color-rarity-star)]',
  'rarity-crown': 'bg-[rgba(232,180,248,0.15)] text-[var(--color-rarity-crown)]',
  premium: 'bg-[var(--color-accent)] text-[var(--color-background)]',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[var(--font-size-label)] font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
