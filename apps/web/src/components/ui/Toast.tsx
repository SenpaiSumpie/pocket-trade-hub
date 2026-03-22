'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import type { ToastItem, ToastVariant } from '@/stores/toast';
import type { LucideIcon } from 'lucide-react';

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

interface VariantConfig {
  bg: string;
  border: string;
  Icon: LucideIcon;
}

const variantConfig: Record<ToastVariant, VariantConfig> = {
  success: { bg: 'rgba(46,204,113,0.15)', border: '#2ecc71', Icon: CheckCircle },
  error: { bg: 'rgba(231,76,60,0.15)', border: '#e74c3c', Icon: XCircle },
  warning: { bg: 'rgba(230,126,34,0.15)', border: '#e67e22', Icon: AlertTriangle },
  info: { bg: 'rgba(160,160,184,0.1)', border: 'var(--color-on-surface-secondary)', Icon: Info },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const { bg, border, Icon } = variantConfig[toast.variant];

  useEffect(() => {
    // Trigger enter animation on next frame
    requestAnimationFrame(() => {
      setVisible(true);
      setProgress(0);
    });

    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div
      className="overflow-hidden rounded-lg transition-all duration-[var(--motion-duration-fast)]"
      style={{
        backgroundColor: bg,
        borderLeft: `3px solid ${border}`,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon size={18} style={{ color: border, flexShrink: 0, marginTop: 2 }} />
        <p className="flex-1 text-sm text-[var(--color-on-surface)]">{toast.message}</p>
        <button
          onClick={() => onDismiss(toast.id)}
          className="text-[var(--color-on-surface-muted)] transition-colors hover:text-[var(--color-on-surface)]"
        >
          <X size={16} />
        </button>
      </div>
      <div
        className="h-0.5"
        style={{
          backgroundColor: border,
          width: `${progress}%`,
          transition: 'width 4000ms linear',
        }}
      />
    </div>
  );
}
