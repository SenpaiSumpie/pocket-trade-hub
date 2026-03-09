import { create } from 'zustand';
import type { Notification } from '@pocket-trade-hub/shared';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;

  // Actions
  setNotifications: (notifications: Notification[], hasMore: boolean) => void;
  appendNotifications: (notifications: Notification[], hasMore: boolean) => void;
  addNotification: (notification: Notification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  setUnreadCount: (count: number) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  hasMore: false,

  setNotifications: (notifications, hasMore) =>
    set({ notifications, hasMore }),

  appendNotifications: (newNotifications, hasMore) =>
    set((state) => ({
      notifications: [...state.notifications, ...newNotifications],
      hasMore,
    })),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markRead: (id) =>
    set((state) => {
      const notif = state.notifications.find((n) => n.id === id);
      if (!notif || notif.read) return state;
      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setLoading: (loading) => set({ loading }),

  reset: () =>
    set({
      notifications: [],
      unreadCount: 0,
      loading: false,
      hasMore: false,
    }),
}));
