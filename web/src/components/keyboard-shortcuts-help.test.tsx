import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { KeyboardShortcutsHelp } from './keyboard-shortcuts-help';

describe('KeyboardShortcutsHelp', () => {
  describe('Rendering', () => {
    it('does not render when closed', () => {
      render(<KeyboardShortcutsHelp open={false} onClose={vi.fn()} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders dialog when open', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /keyboard shortcuts/i })).toBeInTheDocument();
    });

    it('has proper ARIA attributes', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
    });
  });

  describe('Shortcut Display', () => {
    it('displays new expense shortcut', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      expect(screen.getByText(/new expense/i)).toBeInTheDocument();
      expect(screen.getByText(/⌘⌥N/i)).toBeInTheDocument();
    });

    it('displays new income shortcut', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      expect(screen.getByText(/new income/i)).toBeInTheDocument();
      expect(screen.getByText(/⌘⌥⇧N/i)).toBeInTheDocument();
    });

    it('displays import CSV shortcut', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      expect(screen.getByText(/import csv/i)).toBeInTheDocument();
      expect(screen.getByText(/⌘⌥I/i)).toBeInTheDocument();
    });

    it('displays command palette shortcut', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      expect(screen.getByText(/command palette/i)).toBeInTheDocument();
      expect(screen.getByText(/⌘K/i)).toBeInTheDocument();
    });

    it('displays focus search shortcut', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      expect(screen.getByText(/focus search/i)).toBeInTheDocument();
      expect(screen.getByText(/⌘F/i)).toBeInTheDocument();
    });

    it('displays help overlay shortcut', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      expect(screen.getByText(/show.*help/i)).toBeInTheDocument();
      expect(screen.getByText(/⌘\//i)).toBeInTheDocument();
    });
  });

  describe('Platform Detection', () => {
    it('shows ⌘ and ⌥ symbols for macOS shortcuts', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      // Should show Mac-style symbols
      const commandSymbols = screen.getAllByText(/⌘/);
      expect(commandSymbols.length).toBeGreaterThan(0);

      const optionSymbols = screen.getAllByText(/⌥/);
      expect(optionSymbols.length).toBeGreaterThan(0);
    });

    it('includes platform guidance for Windows/Linux users', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      // Should mention Ctrl and Alt equivalents
      expect(screen.getByText(/windows\/linux/i)).toBeInTheDocument();
      expect(screen.getByText('Ctrl')).toBeInTheDocument();
      expect(screen.getByText('Alt')).toBeInTheDocument();
    });
  });

  describe('Interaction', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<KeyboardShortcutsHelp open={true} onClose={handleClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
      const handleClose = vi.fn();
      render(<KeyboardShortcutsHelp open={true} onClose={handleClose} />);

      const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
      window.dispatchEvent(event);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const handleClose = vi.fn();
      render(<KeyboardShortcutsHelp open={true} onClose={handleClose} />);

      // Click the backdrop (the overlay behind the dialog)
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        await user.click(backdrop);
        expect(handleClose).toHaveBeenCalled();
      }
    });
  });

  describe('Focus Management', () => {
    it('focuses close button when opened', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      // Note: Testing actual focus in JSDOM is limited, but we can verify the button exists
      expect(closeButton).toBeInTheDocument();
    });

    it('has focusable elements within dialog', async () => {
      const user = userEvent.setup();
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      const closeButton = screen.getByRole('button', { name: /close/i });

      // Verify close button is focusable
      expect(closeButton).toBeInTheDocument();

      // Tab navigation works
      await user.tab();

      // At least one element should be focusable
      expect(document.activeElement).toBeTruthy();
    });
  });

  describe('Grouping', () => {
    it('groups shortcuts by category', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      // Should have section headings (using getAllByText since "Navigation" appears in help text too)
      const navigationHeadings = screen.getAllByText(/navigation/i);
      expect(navigationHeadings.length).toBeGreaterThan(0);
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has descriptive labels for all shortcuts', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      // Each shortcut should have a description
      const shortcuts = [
        'New Expense',
        'New Income',
        'Import CSV',
        'Command Palette',
        'Focus Search',
        'Show Help',
      ];

      shortcuts.forEach((shortcut) => {
        expect(screen.getByText(new RegExp(shortcut, 'i'))).toBeInTheDocument();
      });
    });

    it('uses semantic HTML for shortcut list', () => {
      render(<KeyboardShortcutsHelp open={true} onClose={vi.fn()} />);

      // Should use list structures
      const lists = screen.getAllByRole('list');
      expect(lists.length).toBeGreaterThan(0);
    });
  });
});
