import type { ReactNode } from 'react';
import { useToast } from '@/lib/toast-context';

export function ToastViewport(): ReactNode {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-md border border-slate-300 bg-white/95 px-4 py-3 text-sm text-slate-900 shadow-lg dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-50"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{toast.title}</p>
              {toast.description ? (
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  {toast.description}
                </p>
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
        </div>
      ))}
    </div>
  );
}
