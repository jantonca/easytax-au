import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useGlobalShortcuts } from './use-global-shortcuts';

// Test component that uses the hook
function TestComponent({
  onNewExpense,
  onNewIncome,
  onImport,
  onHelp,
  onSearch,
}: {
  onNewExpense?: () => void;
  onNewIncome?: () => void;
  onImport?: () => void;
  onHelp?: () => void;
  onSearch?: () => void;
}) {
  useGlobalShortcuts({
    onNewExpense,
    onNewIncome,
    onImport,
    onHelp,
    onSearch,
  });
  return null;
}

describe('useGlobalShortcuts', () => {
  beforeEach(() => {
    // Clear any event listeners
    vi.clearAllMocks();
  });

  describe('Cmd/Ctrl+N - New Expense', () => {
    it('calls onNewExpense when Cmd+N is pressed (macOS)', () => {
      const handler = vi.fn();
      render(<TestComponent onNewExpense={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calls onNewExpense when Ctrl+N is pressed (Windows/Linux)', () => {
      const handler = vi.fn();
      render(<TestComponent onNewExpense={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not call onNewExpense when only N is pressed', () => {
      const handler = vi.fn();
      render(<TestComponent onNewExpense={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Cmd/Ctrl+Shift+N - New Income', () => {
    it('calls onNewIncome when Cmd+Shift+N is pressed (macOS)', () => {
      const handler = vi.fn();
      render(<TestComponent onNewIncome={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'N', // Capital N when shift is pressed
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calls onNewIncome when Ctrl+Shift+N is pressed (Windows/Linux)', () => {
      const handler = vi.fn();
      render(<TestComponent onNewIncome={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'N',
        ctrlKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onNewExpense when Cmd+Shift+N is pressed', () => {
      const expenseHandler = vi.fn();
      const incomeHandler = vi.fn();
      render(<TestComponent onNewExpense={expenseHandler} onNewIncome={incomeHandler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'N',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(incomeHandler).toHaveBeenCalledTimes(1);
      expect(expenseHandler).not.toHaveBeenCalled(); // Should NOT trigger expense
    });
  });

  describe('Cmd/Ctrl+I - Import CSV', () => {
    it('calls onImport when Cmd+I is pressed', () => {
      const handler = vi.fn();
      render(<TestComponent onImport={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'i',
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calls onImport when Ctrl+I is pressed', () => {
      const handler = vi.fn();
      render(<TestComponent onImport={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'i',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cmd/Ctrl+/ - Help Overlay', () => {
    it('calls onHelp when Cmd+/ is pressed', () => {
      const handler = vi.fn();
      render(<TestComponent onHelp={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: '/',
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calls onHelp when Ctrl+/ is pressed', () => {
      const handler = vi.fn();
      render(<TestComponent onHelp={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: '/',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cmd/Ctrl+F - Focus Search', () => {
    it('calls onSearch when Cmd+F is pressed', () => {
      const handler = vi.fn();
      render(<TestComponent onSearch={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'f',
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('calls onSearch when Ctrl+F is pressed', () => {
      const handler = vi.fn();
      render(<TestComponent onSearch={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event Prevention', () => {
    it('prevents default browser behavior for shortcuts', () => {
      const handler = vi.fn();
      render(<TestComponent onNewExpense={handler} />);

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
        bubbles: true,
      });

      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      window.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Input Field Exclusion', () => {
    it('does not trigger shortcuts when focused on input field', () => {
      const handler = vi.fn();
      render(<TestComponent onNewExpense={handler} />);

      // Create and focus an input element
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
        bubbles: true,
      });
      input.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });

    it('does not trigger shortcuts when focused on textarea', () => {
      const handler = vi.fn();
      render(<TestComponent onNewExpense={handler} />);

      const textarea = document.createElement('textarea');
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
        bubbles: true,
      });
      textarea.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    });
  });

  describe('Cleanup', () => {
    it('removes event listener on unmount', () => {
      const handler = vi.fn();
      const { unmount } = render(<TestComponent onNewExpense={handler} />);

      unmount();

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        metaKey: true,
        bubbles: true,
      });
      window.dispatchEvent(event);

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
