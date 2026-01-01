import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

function TestComponent({ onModK }: { onModK: () => void }): ReactElement | null {
  useKeyboardShortcuts({ 'mod+k': onModK });
  return null;
}

describe('useKeyboardShortcuts', () => {
  it('invokes handler on Meta+K', () => {
    const handler = vi.fn();

    render(<TestComponent onModK={handler} />);

    const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('invokes handler on Ctrl+K', () => {
    const handler = vi.fn();

    render(<TestComponent onModK={handler} />);

    const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
