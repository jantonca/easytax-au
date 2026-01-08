import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CategoryDto } from '@/lib/api-client';
import { CategorySelect } from './category-select';

// Mock category data
const mockCategories: CategoryDto[] = [
  {
    id: '1',
    name: 'Software',
    basLabel: '1B',
    isDeductible: true,
    description: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Hosting',
    basLabel: '1B',
    isDeductible: true,
    description: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Internet',
    basLabel: 'G10',
    isDeductible: true,
    description: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'Marketing',
    basLabel: '1B',
    isDeductible: true,
    description: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Office Supplies',
    basLabel: 'G10',
    isDeductible: true,
    description: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('CategorySelect', () => {
  // Happy Path Tests
  describe('Basic Rendering', () => {
    it('renders with placeholder when no selection', () => {
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      expect(screen.getByRole('button', { name: /select category/i })).toBeInTheDocument();
      expect(screen.getByText(/select category/i)).toBeInTheDocument();
    });

    it('shows selected category name when value is provided', () => {
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="2" onChange={onChange} />);

      expect(screen.getByRole('button')).toHaveTextContent('Hosting');
    });

    it('renders in disabled state', () => {
      const onChange = vi.fn();
      render(
        <CategorySelect categories={mockCategories} value="" onChange={onChange} disabled={true} />,
      );

      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Dropdown Interaction', () => {
    it('opens dropdown on button click', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      const button = screen.getByRole('button', { name: /select category/i });
      await user.click(button);

      // Dropdown should be visible
      expect(screen.getByRole('listbox', { name: /category options/i })).toBeInTheDocument();
    });

    it('displays all categories in dropdown list sorted alphabetically', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      // Should have 5 options
      expect(options).toHaveLength(5);

      // Check alphabetical order
      const names = options.map((opt) => opt.textContent);
      expect(names).toEqual(['Hosting', 'Internet', 'Marketing', 'Office Supplies', 'Software']);
    });

    it('selects category on click and closes dropdown', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      // Open dropdown
      await user.click(screen.getByRole('button'));

      // Click on Hosting
      const listbox = screen.getByRole('listbox');
      const hostingOption = within(listbox).getByRole('option', { name: /hosting/i });
      await user.click(hostingOption);

      // Should call onChange with category ID
      expect(onChange).toHaveBeenCalledWith('2');

      // Dropdown should close
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('filters categories by name on search input (case-insensitive)', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      // Find search input
      const searchInput = screen.getByRole('searchbox', { name: /search categories/i });
      await user.type(searchInput, 'soft');

      // Should only show Software
      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');
      expect(options).toHaveLength(1);
      expect(options[0]).toHaveTextContent('Software');
    });

    it('shows "No results" when search has no matches', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'xyz123nonexistent');

      // Should show "No results" message
      expect(screen.getByText(/no category found/i)).toBeInTheDocument();
    });

    it('highlights matching text in search results', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'mar');

      // Marketing should be in results
      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');
      expect(options).toHaveLength(1);

      // Check if the matching part is highlighted with <mark> element
      const option = options[0];
      const mark = option.querySelector('mark');
      expect(mark).toBeInTheDocument();
      expect(mark?.textContent).toBe('Mar');
    });

    it('clears search input when dropdown closes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'soft');

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
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

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
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

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
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      // Navigate to second option (first is Hosting, second is Internet)
      await user.keyboard('{ArrowDown}');

      // Press Enter
      await user.keyboard('{Enter}');

      // Should call onChange with Internet's ID (second in alphabetical order)
      expect(onChange).toHaveBeenCalledWith('3');

      // Dropdown should close
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes dropdown on Escape key', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Escape}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty category list gracefully', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={[]} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      // Should show "No categories available" message
      expect(screen.getByText(/no categories available/i)).toBeInTheDocument();
    });

    it('handles categories with special characters in names', async () => {
      const specialCategories: CategoryDto[] = [
        {
          id: '1',
          name: 'R&D',
          basLabel: '1B',
          isDeductible: true,
          description: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: '2',
          name: "Client's Gifts",
          basLabel: 'G10',
          isDeductible: true,
          description: null,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={specialCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox');
      expect(within(listbox).getByRole('option', { name: /r&d/i })).toBeInTheDocument();
      expect(within(listbox).getByRole('option', { name: /client's gifts/i })).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('button has proper aria-label', () => {
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      const button = screen.getByRole('button', { name: /select category/i });
      expect(button).toHaveAccessibleName();
    });

    it('listbox has proper ARIA attributes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox', { name: /category options/i });
      expect(listbox).toHaveAttribute('aria-label', expect.stringMatching(/category options/i));
    });

    it('options have proper role and aria-selected state', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="2" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');

      options.forEach((option) => {
        expect(option).toHaveAttribute('role', 'option');
        expect(option).toHaveAttribute('aria-selected');
      });

      // Selected option should have aria-selected="true"
      const hostingOption = within(listbox).getByRole('option', { name: /hosting/i });
      expect(hostingOption).toHaveAttribute('aria-selected', 'true');
    });

    it('search input has accessible label', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<CategorySelect categories={mockCategories} value="" onChange={onChange} />);

      await user.click(screen.getByRole('button'));

      const searchInput = screen.getByRole('searchbox', { name: /search categories/i });
      expect(searchInput).toHaveAccessibleName();
    });
  });

  describe('Validation State', () => {
    it('shows error message when error prop is provided', () => {
      const onChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          value=""
          onChange={onChange}
          error="Category is required"
        />,
      );

      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });

    it('applies error styling when error prop is provided', () => {
      const onChange = vi.fn();
      render(
        <CategorySelect
          categories={mockCategories}
          value=""
          onChange={onChange}
          error="Category is required"
        />,
      );

      const button = screen.getByRole('button');
      // Should have error border color class (red)
      expect(button.className).toMatch(/border-red/);
    });
  });
});
