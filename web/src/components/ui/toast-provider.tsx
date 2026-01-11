import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ToastContext, type Toast, type ToastContextValue } from '@/lib/toast-context';

interface ToastProviderProps {
  children: ReactNode;
}

interface ToastTimerState {
  timer: ReturnType<typeof setTimeout>;
  startTime: number;
  remainingDuration: number;
  isPaused: boolean;
}

// Default durations based on variant (in milliseconds)
const DEFAULT_DURATIONS: Record<string, number> = {
  success: 4000,
  default: 5000,
  error: 8000,
};

export function ToastProvider({ children }: ToastProviderProps): ReactElement {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ToastTimerState>>(new Map());

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((state) => clearTimeout(state.timer));
      timers.clear();
    };
  }, []);

  const dismissToast: ToastContextValue['dismissToast'] = useCallback((id) => {
    // Clear timer if exists
    const timerState = timersRef.current.get(id);
    if (timerState !== undefined) {
      clearTimeout(timerState.timer);
      timersRef.current.delete(id);
    }

    // Remove toast
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pauseToast: ToastContextValue['pauseToast'] = useCallback((id) => {
    const state = timersRef.current.get(id);
    if (!state || state.isPaused) return;

    // Clear the current timer
    clearTimeout(state.timer);

    // Calculate remaining duration
    const elapsed = Date.now() - state.startTime;
    const remaining = Math.max(0, state.remainingDuration - elapsed);

    // Update state to paused
    timersRef.current.set(id, {
      ...state,
      isPaused: true,
      remainingDuration: remaining,
    });
  }, []);

  const resumeToast: ToastContextValue['resumeToast'] = useCallback(
    (id) => {
      const state = timersRef.current.get(id);
      if (!state || !state.isPaused) return;

      // Create new timer with remaining duration
      const startTime = Date.now();
      const timer = setTimeout(() => {
        dismissToast(id);
      }, state.remainingDuration);

      // Update state to not paused
      timersRef.current.set(id, {
        timer,
        startTime,
        remainingDuration: state.remainingDuration,
        isPaused: false,
      });
    },
    [dismissToast],
  );

  const showToast: ToastContextValue['showToast'] = useCallback(
    (toast) => {
      const id = crypto.randomUUID();
      const variant = toast.variant || 'default';

      // Determine duration: use provided duration if explicitly set, otherwise default based on variant
      const duration = 'duration' in toast ? toast.duration : DEFAULT_DURATIONS[variant];

      const newToast: Toast = {
        id,
        variant,
        ...toast,
        duration,
      };

      setToasts((current) => {
        const updated = [...current, newToast];

        // Enforce max 5 toast stacking limit (FIFO)
        if (updated.length > 5) {
          const oldest = updated[0];
          if (oldest) {
            // Clear timer for oldest toast
            const timerState = timersRef.current.get(oldest.id);
            if (timerState !== undefined) {
              clearTimeout(timerState.timer);
              timersRef.current.delete(oldest.id);
            }
          }
          return updated.slice(1);
        }

        return updated;
      });

      // Set up auto-dismiss timer if duration is specified
      if (duration !== undefined && duration > 0) {
        const startTime = Date.now();
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);

        timersRef.current.set(id, {
          timer,
          startTime,
          remainingDuration: duration,
          isPaused: false,
        });
      }
    },
    [dismissToast],
  );

  const value: ToastContextValue = useMemo(
    () => ({ toasts, showToast, dismissToast, pauseToast, resumeToast }),
    [toasts, showToast, dismissToast, pauseToast, resumeToast],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
