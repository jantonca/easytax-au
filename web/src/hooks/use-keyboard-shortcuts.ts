import { useEffect } from 'react';

export type ShortcutMap = {
  /** Currently only 'mod+k' is supported (Meta+K on macOS, Ctrl+K elsewhere). */
  'mod+k'?: () => void;
};

export function useKeyboardShortcuts(shortcuts: ShortcutMap): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const handler = shortcuts['mod+k'];

      if (!handler) return;

      const key = event.key.toLowerCase();
      const isMod = event.metaKey || event.ctrlKey;

      if (isMod && key === 'k') {
        event.preventDefault();
        handler();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
}
