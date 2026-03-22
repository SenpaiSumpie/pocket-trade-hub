import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  message: string;
}

interface ToastState {
  queue: ToastItem[];
  show: (variant: ToastVariant, message: string) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  queue: [],
  show: (variant, message) =>
    set((s) => ({
      queue: [
        ...s.queue.slice(-3),
        { id: Date.now().toString(), variant, message },
      ],
    })),
  dismiss: (id) =>
    set((s) => ({ queue: s.queue.filter((t) => t.id !== id) })),
}));
