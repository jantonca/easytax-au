import { useState, type ReactNode } from 'react';
import { useToast } from '@/lib/toast-context';

// Progress bar colors by variant
const PROGRESS_BAR_COLORS = {
  success: 'bg-emerald-500 dark:bg-emerald-600',
  error: 'bg-red-500 dark:bg-red-600',
  default: 'bg-sky-500 dark:bg-sky-600',
} as const;

export function ToastViewport(): ReactNode {
  const { toasts, dismissToast, pauseToast, resumeToast } = useToast();
  const [hoveredToastId, setHoveredToastId] = useState<string | null>(null);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const variant = toast.variant || 'default';
        const isHovered = hoveredToastId === toast.id;
        const hasDuration = toast.duration !== undefined && toast.duration > 0;

        return (
          <div
            key={toast.id}
            className="animate-slide-in relative overflow-hidden rounded-md border border-slate-300 bg-white/95 px-4 py-3 text-sm text-slate-900 shadow-lg transition-all duration-300 ease-in-out dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-50"
            role="status"
            aria-live="polite"
            onMouseEnter={() => {
              setHoveredToastId(toast.id);
              pauseToast(toast.id);
            }}
            onMouseLeave={() => {
              setHoveredToastId(null);
              resumeToast(toast.id);
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {toast.description}
                  </p>
                ) : null}
                {toast.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismissToast(toast.id);
                    }}
                    className="mt-2 text-xs font-medium underline hover:no-underline focus-visible:outline-sky-500"
                  >
                    {toast.action.label}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Dismiss
              </button>
            </div>

            {/* Progress bar */}
            {hasDuration ? (
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/30 dark:bg-slate-700/30"
                aria-hidden="true"
              >
                <div
                  className={`toast-progress-bar h-full ${PROGRESS_BAR_COLORS[variant]} ${isHovered ? 'paused' : ''}`}
                  style={{ '--duration': `${toast.duration}ms` } as React.CSSProperties}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
