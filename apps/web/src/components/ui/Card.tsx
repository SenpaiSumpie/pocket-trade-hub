'use client';

import { type ReactNode, useState } from 'react';

interface CardProps {
  elevation?: 'none' | 'low' | 'medium' | 'high';
  padding?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}

const elevationStyles: Record<string, string> = {
  none: 'var(--elevation-none)',
  low: 'var(--elevation-low)',
  medium: 'var(--elevation-medium)',
  high: 'var(--elevation-high)',
};

const paddingClasses: Record<string, string> = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  elevation = 'low',
  padding = 'md',
  onClick,
  children,
  className = '',
}: CardProps) {
  const [hovered, setHovered] = useState(false);

  const shadow = onClick && hovered ? elevationStyles.medium : elevationStyles[elevation];

  const interactiveClasses = onClick
    ? 'cursor-pointer transition-all duration-[var(--motion-duration-fast)] hover:-translate-y-0.5'
    : '';

  return (
    <div
      className={`rounded-[var(--border-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] ${paddingClasses[padding]} ${interactiveClasses} ${className}`}
      style={{ boxShadow: shadow }}
      onClick={onClick}
      onMouseEnter={onClick ? () => setHovered(true) : undefined}
      onMouseLeave={onClick ? () => setHovered(false) : undefined}
    >
      {children}
    </div>
  );
}
