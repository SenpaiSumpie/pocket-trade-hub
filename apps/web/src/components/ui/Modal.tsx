'use client';

import { useEffect, useCallback, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, onClose, children }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  // Clean up keyboard listener and body overflow when closing
  useEffect(() => {
    if (!open) {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    }
  }, [open, handleKeyDown]);

  if ((!mounted && !open) || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-open={open}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity duration-[var(--motion-duration-normal)] data-[open=false]:opacity-0 data-[open=true]:opacity-100"
      onClick={onClose}
    >
      <div
        data-open={open}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl bg-[var(--color-surface)] p-6 transition-all duration-[var(--motion-duration-normal)] data-[open=false]:scale-95 data-[open=false]:opacity-0 data-[open=true]:scale-100 data-[open=true]:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-text-muted transition-colors hover:bg-surface-hover hover:text-text"
          aria-label="Close"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
