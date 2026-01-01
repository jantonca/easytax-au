import type { Dispatch, ReactElement, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps): ReactElement | null {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault();
        onOpenChange(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-24">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
        className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950/95 shadow-xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
          <h2 id="command-palette-title" className="text-sm font-semibold text-slate-100">
            Command palette
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-400 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            Esc
          </button>
        </div>
        <div className="space-y-2 px-4 py-3 text-sm text-slate-300">
          <p className="text-xs text-slate-400">
            Command palette wiring is in place (⌘K / Ctrl+K). Detailed commands will be added in a
            later phase.
          </p>
        </div>
      </div>
    </div>
  );
}
