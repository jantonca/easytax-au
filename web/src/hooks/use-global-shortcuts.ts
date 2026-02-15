import { useEffect } from 'react';

/**
 * Global keyboard shortcuts configuration
 */
export interface GlobalShortcuts {
  /** Cmd/Ctrl+N - Create new expense */
  onNewExpense?: () => void;
  /** Cmd/Ctrl+Shift+N - Create new income */
  onNewIncome?: () => void;
  /** Cmd/Ctrl+I - Navigate to import page */
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
      const isShift = event.shiftKey;

      // Cmd/Ctrl+Shift+N - New Income (check this first before Cmd+N)
      if (isMod && isShift && key === 'n' && shortcuts.onNewIncome) {
        event.preventDefault();
        shortcuts.onNewIncome();
        return;
      }

      // Cmd/Ctrl+N - New Expense
      if (isMod && !isShift && key === 'n' && shortcuts.onNewExpense) {
        event.preventDefault();
        shortcuts.onNewExpense();
        return;
      }

      // Cmd/Ctrl+I - Import CSV
      if (isMod && key === 'i' && shortcuts.onImport) {
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
