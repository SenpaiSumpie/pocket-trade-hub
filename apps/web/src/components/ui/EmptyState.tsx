'use client';

import type { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ icon: Icon, title, subtitle, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <Icon size={64} className="mb-4 text-[var(--color-on-surface-muted)]" />
      <h3 className="text-[var(--font-size-subheading)] font-bold text-[var(--color-on-surface)]">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-2 max-w-md text-[var(--font-size-body)] text-[var(--color-on-surface-secondary)]">
          {subtitle}
        </p>
      ) : null}
      {ctaLabel && onCta ? (
        <Button className="mt-6" onClick={onCta}>
          {ctaLabel}
        </Button>
      ) : null}
    </div>
  );
}
