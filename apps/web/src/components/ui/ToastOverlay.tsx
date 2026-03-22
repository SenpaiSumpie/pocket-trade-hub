'use client';

import { createPortal } from 'react-dom';
import { useToastStore } from '@/stores/toast';
import { Toast } from './Toast';

export function ToastOverlay() {
  const queue = useToastStore((s) => s.queue);
  const dismiss = useToastStore((s) => s.dismiss);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {queue.slice(0, 4).map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>,
    document.body,
  );
}
