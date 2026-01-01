import React from 'react';

export type ToastVariant = 'default' | 'success' | 'error';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function useToast(): ToastContextValue {
  const ctx = React.useContext(ToastContext);

  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return ctx;
}
