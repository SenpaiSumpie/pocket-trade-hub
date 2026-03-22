import { useToastStore } from '@/src/stores/toast';

export function useToast() {
  const show = useToastStore((s) => s.show);
  return {
    success: (msg: string) => show('success', msg),
    error: (msg: string) => show('error', msg),
    info: (msg: string) => show('info', msg),
    warning: (msg: string) => show('warning', msg),
  };
}
