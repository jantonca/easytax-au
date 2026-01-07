import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { ToastContext, type Toast, type ToastContextValue } from '@/lib/toast-context';

interface ToastProviderProps {
  children: ReactNode;
}

// Default durations based on variant (in milliseconds)
const DEFAULT_DURATIONS: Record<string, number> = {
  success: 4000,
  default: 5000,
  error: 8000,
};

export function ToastProvider({ children }: ToastProviderProps): ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const showToast: ToastContextValue['showToast'] = (toast) => {
    const id = crypto.randomUUID();
    const variant = toast.variant || 'default';

    // Determine duration: use provided duration if explicitly set, otherwise default based on variant
    const duration = 'duration' in toast
      ? toast.duration
      : DEFAULT_DURATIONS[variant];

    const newToast: Toast = {
      id,
      variant,
      ...toast,
      duration,
    };

    setToasts((current) => [...current, newToast]);

    // Set up auto-dismiss timer if duration is specified
    if (duration !== undefined && duration > 0) {
      const timer = setTimeout(() => {
        dismissToast(id);
      }, duration);
      timersRef.current.set(id, timer);
    }
  };

  const dismissToast: ToastContextValue['dismissToast'] = (id) => {
    // Clear timer if exists
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }

    // Remove toast
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const value: ToastContextValue = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
