import { useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastContextValue } from '@/lib/toast-context';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast: ToastContextValue['showToast'] = (toast) => {
    setToasts((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        variant: 'default',
        ...toast,
      },
    ]);
  };

  const dismissToast: ToastContextValue['dismissToast'] = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const value: ToastContextValue = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
