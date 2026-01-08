import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ProviderDto } from '@/lib/api-client';
import { ProviderSelect } from './provider-select';

// Mock provider data
const mockProviders: ProviderDto[] = [
  {
    id: '1',
    name: 'GitHub',
    isInternational: true,
    defaultCategoryId: null,
    abn: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'VentraIP',
    isInternational: false,
    defaultCategoryId: null,
    abn: '12345678901',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'iinet',
    isInternational: false,
    defaultCategoryId: null,
    abn: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Google Workspace',
    isInternational: true,
    defaultCategoryId: null,
    abn: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Atlassian',
    isInternational: true,
    defaultCategoryId: null,
    abn: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('ProviderSelect', () => {
  // Happy Path Tests
  describe('Basic Rendering', () => {
    it('renders with placeholder when no selection', () => {
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      expect(screen.getByRole('button', { name: /select provider/i })).toBeInTheDocument();
      expect(screen.getByText(/select provider/i)).toBeInTheDocument();
    });

    it('shows selected provider name when value is provided', () => {
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="2" onChange={onChange} />);

      expect(screen.getByRole('button')).toHaveTextContent('VentraIP');
    });

    it('renders in disabled state', () => {
      const onChange = vi.fn();
      render(
        <ProviderSelect providers={mockProviders} value="" onChange={onChange} disabled={true} />,
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Dropdown Interaction', () => {
    it('opens dropdown on button click', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      const button = screen.getByRole('button', { name: /select provider/i });
      await user.click(button);

      // Dropdown should be visible
      expect(screen.getByRole('listbox', { name: /provider options/i })).toBeInTheDocument();
    });

    it('displays all providers in dropdown list sorted alphabetically', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      // Should have 5 options
      expect(options).toHaveLength(5);

      // Check alphabetical order
      const names = options.map((opt) => opt.textContent);
      expect(names).toEqual(['Atlassian', 'GitHub', 'Google Workspace', 'iinet', 'VentraIP']);
    });

    it('selects provider on click and closes dropdown', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      // Open dropdown
      await user.click(screen.getByRole('button'));

      // Click on VentraIP
      const listbox = screen.getByRole('listbox');
      const ventraOption = within(listbox).getByRole('option', { name: /ventraip/i });
      await user.click(ventraOption);

      // Should call onChange with provider ID
      expect(onChange).toHaveBeenCalledWith('2');

      // Dropdown should close
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters providers by name on search input (case-insensitive)', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      // Find search input
      const searchInput = screen.getByRole('searchbox', { name: /search providers/i });
      await user.type(searchInput, 'git');

      // Should only show GitHub
      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('GitHub');
    });

    it('shows "No results" when search has no matches', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'xyz123nonexistent');

      // Should show "No results" message
      expect(screen.getByText(/no provider found/i)).toBeInTheDocument();
    });

    it('highlights matching text in search results', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'goo');

      // Google Workspace should be in results
      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');
      expect(options).toHaveLength(1);

      // Check if the matching part is highlighted with <mark> element
      const option = options[0];
      const mark = option.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark?.textContent).toBe('Goo');
    });

    it('clears search input when dropdown closes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'git');

      // Close dropdown by pressing Escape
      await user.keyboard('{Escape}');

      // Reopen dropdown
      await user.click(screen.getByRole('button'));

      // Search input should be cleared
      const newSearchInput = screen.getByRole('searchbox');
      expect(newSearchInput).toHaveValue('');
    });
  });

  describe('Keyboard Navigation', () => {
    it('moves focus down with Arrow Down key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      // First option should be focused initially
      expect(options[0]).toHaveAttribute('aria-selected', 'true');

      // Press Arrow Down
      await user.keyboard('{ArrowDown}');

      // Second option should be focused
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('moves focus up with Arrow Up key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      // Press Arrow Down twice to get to third option
      await user.keyboard('{ArrowDown}{ArrowDown}');

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      // Third option should be focused
      expect(options[2]).toHaveAttribute('aria-selected', 'true');

      // Press Arrow Up
      await user.keyboard('{ArrowUp}');

      // Second option should be focused
      expect(options[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('selects focused option on Enter key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      // Navigate to second option
      await user.keyboard('{ArrowDown}');

      // Press Enter
      await user.keyboard('{Enter}');

      // Should call onChange with second provider's ID (GitHub in alphabetical order)
      expect(onChange).toHaveBeenCalledWith('1');

      // Dropdown should close
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty provider list gracefully', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={[]} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      // Should show "No providers available" message
      expect(screen.getByText(/no providers available/i)).toBeInTheDocument();
    });

    it('handles providers with special characters in names', async () => {
      const specialProviders: ProviderDto[] = [
        {
          id: '1',
          name: 'GitHub.com',
          isInternational: true,
          defaultCategoryId: null,
          abn: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: "O'Reilly Media",
          isInternational: true,
          defaultCategoryId: null,
          abn: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={specialProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByRole('option', { name: /github\.com/i })).toBeInTheDocument();
      expect(within(listbox).getByRole('option', { name: /o'reilly media/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('button has proper aria-label', () => {
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      const button = screen.getByRole('button', { name: /select provider/i });
      expect(button).toHaveAccessibleName();
    });

    it('listbox has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox', { name: /provider options/i });
      expect(listbox).toHaveAttribute('aria-label', expect.stringMatching(/provider options/i));
    });

    it('options have proper role and aria-selected state', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="2" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      options.forEach((option) => {
        expect(option).toHaveAttribute('role', 'option');
        expect(option).toHaveAttribute('aria-selected');
      });

      // Selected option should have aria-selected="true"
      const ventraOption = within(listbox).getByRole('option', { name: /ventraip/i });
      expect(ventraOption).toHaveAttribute('aria-selected', 'true');
    });

    it('search input has accessible label', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<ProviderSelect providers={mockProviders} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByRole('searchbox', { name: /search providers/i });
      expect(searchInput).toHaveAccessibleName();
    });
  });

  describe('Validation State', () => {
    it('shows error message when error prop is provided', () => {
      const onChange = vi.fn();
      render(
        <ProviderSelect
          providers={mockProviders}
          value=""
          onChange={onChange}
          error="Provider is required"
        />,
      );

      expect(screen.getByText('Provider is required')).toBeInTheDocument();
    });

    it('applies error styling when error prop is provided', () => {
      const onChange = vi.fn();
      render(
        <ProviderSelect
          providers={mockProviders}
          value=""
          onChange={onChange}
          error="Provider is required"
        />,
      );

      const button = screen.getByRole('button');
      // Should have error border color class (red)
      expect(button.className).toMatch(/border-red/);
    });
  });
});
