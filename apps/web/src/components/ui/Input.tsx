'use client';

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';

type InputProps = {
  label?: string;
  error?: string;
  textarea?: boolean;
} & (
  | (InputHTMLAttributes<HTMLInputElement> & { textarea?: false })
  | (TextareaHTMLAttributes<HTMLTextAreaElement> & { textarea: true })
);

const baseClasses =
  'rounded-lg border border-border bg-[var(--color-background)] px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50 transition-colors duration-[var(--motion-duration-fast)]';

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ label, error, textarea, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const errorClass = error ? 'border-[var(--color-error)]' : '';

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-muted"
          >
            {label}
          </label>
        )}
        {textarea ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            id={inputId}
            className={`${baseClasses} min-h-[100px] resize-y ${errorClass} ${className}`}
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            id={inputId}
            className={`${baseClasses} ${errorClass} ${className}`}
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {error && <p className="text-xs text-[var(--color-error)]">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
