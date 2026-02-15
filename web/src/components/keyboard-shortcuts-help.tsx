import type { ReactElement } from 'react';
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  key: string;
  description: string;
}

interface ShortcutSection {
  title: string;
  shortcuts: Shortcut[];
}

const SHORTCUTS: ShortcutSection[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { key: '⌘K', description: 'Open Command Palette' },
      { key: '⌘/', description: 'Show Help (this dialog)' },
    ],
  },
  {
    title: 'Actions',
    shortcuts: [
      { key: '⌘N', description: 'New Expense' },
      { key: '⌘⇧N', description: 'New Income' },
      { key: '⌘I', description: 'Import CSV' },
      { key: '⌘F', description: 'Focus Search/Filter' },
    ],
  },
];

/**
 * Keyboard Shortcuts Help Dialog
 *
 * Displays a modal overlay showing all available keyboard shortcuts.
 * Triggered by Cmd/Ctrl+/ or from the help menu.
 */
export function KeyboardShortcutsHelp({
  open,
  onClose,
}: KeyboardShortcutsHelpProps): ReactElement | null {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Focus close button when dialog opens
    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    // Handle Escape key
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => {
        // Close when clicking backdrop (outside dialog)
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2
            id="shortcuts-dialog-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-50"
          >
            Keyboard Shortcuts
          </h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            aria-label="Close keyboard shortcuts help"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-400">
            Use{' '}
            <kbd className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold dark:bg-slate-800">
              Ctrl
            </kbd>{' '}
            instead of{' '}
            <kbd className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold dark:bg-slate-800">
              ⌘
            </kbd>{' '}
            on Windows/Linux.
          </p>

          <ul role="list" className="space-y-6">
            {SHORTCUTS.map((section) => (
              <li key={section.title}>
                <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {section.title}
                </h3>
                <ul role="list" className="space-y-2">
                  {section.shortcuts.map((shortcut) => (
                    <li
                      key={shortcut.key}
                      className="flex items-center justify-between rounded-md bg-slate-50 px-4 py-3 dark:bg-slate-800/50"
                    >
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {shortcut.description}
                      </span>
                      <kbd className="rounded bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 dark:bg-slate-900 dark:text-slate-50 dark:ring-slate-700">
                        {shortcut.key}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Press{' '}
            <kbd className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold dark:bg-slate-800">
              Esc
            </kbd>{' '}
            to close this dialog
          </p>
        </div>
      </div>
    </div>
  );
}
