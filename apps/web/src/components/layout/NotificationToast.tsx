'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/hooks/useSocket';
import { X } from 'lucide-react';

function ToastItem({ id, message, timestamp }: { id: string; message: string; timestamp: number }) {
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  useEffect(() => {
    const timer = setTimeout(() => {
      removeNotification(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, removeNotification]);

  return (
    <div className="animate-in slide-in-from-right flex items-start gap-3 rounded-lg border border-gold/30 bg-surface px-4 py-3 shadow-lg">
      <p className="flex-1 text-sm text-text">{message}</p>
      <button
        onClick={() => removeNotification(id)}
        className="text-text-muted transition-colors hover:text-text"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function NotificationToast() {
  const notifications = useNotificationStore((s) => s.notifications);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2">
      {notifications.slice(0, 5).map((n) => (
        <ToastItem key={n.id} id={n.id} message={n.message} timestamp={n.timestamp} />
      ))}
    </div>
  );
}
