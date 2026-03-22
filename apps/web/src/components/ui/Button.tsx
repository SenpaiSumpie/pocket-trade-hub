'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-background)] hover:bg-[var(--color-accent-dark)]',
  secondary:
    'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]',
  ghost:
    'bg-transparent text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]',
  outline:
    'bg-transparent border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon: Icon,
      iconPosition = 'left',
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-[var(--motion-duration-fast)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        {!loading && Icon && iconPosition === 'left' && <Icon size={16} />}
        {children}
        {!loading && Icon && iconPosition === 'right' && <Icon size={16} />}
      </button>
    );
  },
);

Button.displayName = 'Button';
