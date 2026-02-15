import { useEffect } from 'react';

/**
 * Global keyboard shortcuts configuration
 */
export interface GlobalShortcuts {
  /** Ctrl+Alt+N (Cmd+Alt+N on Mac) - Create new expense */
  onNewExpense?: () => void;
  /** Ctrl+Alt+Shift+N (Cmd+Alt+Shift+N on Mac) - Create new income */
  onNewIncome?: () => void;
  /** Ctrl+Alt+I (Cmd+Alt+I on Mac) - Navigate to import page */
  onImport?: () => void;
  /** Cmd/Ctrl+/ - Show keyboard shortcuts help */
  onHelp?: () => void;
  /** Cmd/Ctrl+F - Focus search/filter input */
  onSearch?: () => void;
}

/**
 * Hook for global keyboard shortcuts
 *
 * Provides application-wide keyboard shortcuts that work anywhere in the app.
 * Shortcuts are automatically disabled when typing in input fields or textareas.
 *
 * Uses Ctrl+Alt (Cmd+Alt on Mac) combinations to avoid browser conflicts.
 * Single modifier shortcuts like Ctrl+N conflict with browser actions.
 *
 * @param shortcuts - Object mapping shortcut keys to handler functions
 *
 * @example
 * ```tsx
 * useGlobalShortcuts({
 *   onNewExpense: () => navigate('/expenses/new'),
 *   onNewIncome: () => navigate('/incomes/new'),
 * });
 * ```
 */
export function useGlobalShortcuts(shortcuts: GlobalShortcuts): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      // Don't trigger shortcuts when typing in form fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;
      const isAlt = event.altKey;
      const isShift = event.shiftKey;

      // Ctrl/Cmd+Alt+Shift+N - New Income (check this first before Ctrl/Cmd+Alt+N)
      if (isMod && isAlt && isShift && key === 'n' && shortcuts.onNewIncome) {
        event.preventDefault();
        shortcuts.onNewIncome();
        return;
      }

      // Ctrl/Cmd+Alt+N - New Expense
      if (isMod && isAlt && !isShift && key === 'n' && shortcuts.onNewExpense) {
        event.preventDefault();
        shortcuts.onNewExpense();
        return;
      }

      // Ctrl/Cmd+Alt+I - Import CSV
      if (isMod && isAlt && key === 'i' && shortcuts.onImport) {
        event.preventDefault();
        shortcuts.onImport();
        return;
      }

      // Cmd/Ctrl+/ - Show Help
      if (isMod && key === '/' && shortcuts.onHelp) {
        event.preventDefault();
        shortcuts.onHelp();
        return;
      }

      // Cmd/Ctrl+F - Focus Search
      if (isMod && key === 'f' && shortcuts.onSearch) {
        event.preventDefault();
        shortcuts.onSearch();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}
