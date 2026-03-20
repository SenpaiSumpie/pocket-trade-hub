'use client';

import { useEffect, useRef, useCallback } from 'react';
import { create } from 'zustand';
import { socket, connectSocket, disconnectSocket } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth';

interface Notification {
  id: string;
  type: string;
  message: string;
  data?: unknown;
  timestamp: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

let notifCounter = 0;

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) => {
    const id = `notif-${++notifCounter}`;
    const notification: Notification = { ...n, id, timestamp: Date.now() };
    set((s) => ({
      notifications: [notification, ...s.notifications].slice(0, 20),
      unreadCount: s.unreadCount + 1,
    }));
  },

  removeNotification: (id) =>
    set((s) => ({
      notifications: s.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

export function useSocket() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const connectedRef = useRef(false);

  const handleNotification = useCallback(
    (data: { type?: string; message?: string; data?: unknown }) => {
      addNotification({
        type: data.type ?? 'info',
        message: data.message ?? 'New notification',
        data: data.data,
      });
    },
    [addNotification],
  );

  useEffect(() => {
    if (!isLoggedIn) {
      if (connectedRef.current) {
        disconnectSocket();
        connectedRef.current = false;
      }
      return;
    }

    connectSocket();
    connectedRef.current = true;

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [isLoggedIn, handleNotification]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      if (connectedRef.current) {
        disconnectSocket();
        connectedRef.current = false;
      }
    };
  }, []);
}
