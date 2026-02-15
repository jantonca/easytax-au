import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { IncomeResponseDto } from '@/lib/api-client';
import { IncomesTable } from '@/features/incomes/components/incomes-table';

function createIncome(partial: Partial<IncomeResponseDto>): IncomeResponseDto {
  const base: IncomeResponseDto = {
    id: '1',
    date: '2025-08-15T00:00:00Z',
    clientId: 'client-1',
    invoiceNum: undefined,
    description: undefined,
    subtotalCents: 10000,
    gstCents: 1000,
    totalCents: 11000,
    isPaid: false,
    createdAt: '2025-08-15T10:30:00Z',
    updatedAt: '2025-08-15T10:30:00Z',
    client: {
      id: 'client-1',
      name: 'Acme Corp',
      abn: '51824753556',
      isPsiEligible: false,
    },
  };

  return { ...base, ...partial } as IncomeResponseDto;
}

describe('IncomesTable', () => {
  it('shows empty state when there are no incomes', () => {
    render(<IncomesTable incomes={[]} />);

    expect(screen.getByText('No incomes recorded yet.')).toBeInTheDocument();
  });

  it('sorts by date descending by default', () => {
    const incomes: IncomeResponseDto[] = [
      createIncome({ id: 'older', date: '2025-01-01T00:00:00Z', subtotalCents: 5000 }),
      createIncome({ id: 'newer', date: '2025-12-31T00:00:00Z', subtotalCents: 10000 }),
    ];

    render(<IncomesTable incomes={incomes} />);

    const rows = screen.getAllByRole('row').slice(1); // skip header
    const firstRow = rows[0];

    // Newer date should be first (desc order)
    expect(within(firstRow).getByText('31/12/2025')).toBeInTheDocument();
  });

  it('allows sorting by total via header click', async () => {
    const user = userEvent.setup();

    const incomes: IncomeResponseDto[] = [
      createIncome({ id: 'low', date: '2025-08-15T00:00:00Z', totalCents: 5500 }),
      createIncome({ id: 'high', date: '2025-08-16T00:00:00Z', totalCents: 15000 }),
    ];

    render(<IncomesTable incomes={incomes} />);

    // Default is date-desc so the newer date (high total) is first
    let rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('$150.00')).toBeInTheDocument();

    const totalHeaderButton = screen.getByRole('button', { name: /total/i });
    await user.click(totalHeaderButton); // total asc

    rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('$55.00')).toBeInTheDocument();
  });

  it('allows sorting by client name', async () => {
    const user = userEvent.setup();

    const incomes: IncomeResponseDto[] = [
      createIncome({
        id: '1',
        client: { id: 'c1', name: 'Zulu Co', abn: null, isPsiEligible: false },
      }),
      createIncome({
        id: '2',
        client: { id: 'c2', name: 'Alpha Inc', abn: null, isPsiEligible: false },
      }),
    ];

    render(<IncomesTable incomes={incomes} />);

    const clientHeaderButton = screen.getByRole('button', { name: /client/i });
    await user.click(clientHeaderButton); // client asc

    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Alpha Inc')).toBeInTheDocument();
  });

  it('allows sorting by paid status', async () => {
    const user = userEvent.setup();

    const incomes: IncomeResponseDto[] = [
      createIncome({ id: 'paid', isPaid: true }),
      createIncome({ id: 'unpaid', isPaid: false }),
    ];

    render(<IncomesTable incomes={incomes} />);

    const paidHeaderButton = screen.getByRole('button', { name: /paid/i });
    await user.click(paidHeaderButton); // paid asc (unpaid first)

    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Unpaid')).toBeInTheDocument();
  });

  it('displays income data correctly in table rows', () => {
    const incomes: IncomeResponseDto[] = [
      createIncome({
        id: '1',
        date: '2025-08-15T00:00:00Z',
        invoiceNum: 'INV-2024-001',
        description: 'Web development',
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
        isPaid: true,
        client: { id: 'c1', name: 'Acme Corp', abn: '51824753556', isPsiEligible: false },
      }),
    ];

    render(<IncomesTable incomes={incomes} />);

    expect(screen.getByText('15/08/2025')).toBeInTheDocument();
    expect(screen.getByText('INV-2024-001')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Web development')).toBeInTheDocument();
    expect(screen.getByText('$1,000.00')).toBeInTheDocument(); // subtotal
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // gst
    expect(screen.getByText('$1,100.00')).toBeInTheDocument(); // total

    // Check for paid badge (more specific query to avoid matching header)
    const rows = screen.getAllByRole('row').slice(1);
    expect(within(rows[0]).getByText('Paid')).toBeInTheDocument();
  });

  it('shows dash for missing optional fields', () => {
    const incomes: IncomeResponseDto[] = [
      createIncome({
        id: '1',
        invoiceNum: null,
        description: null,
      }),
    ];

    render(<IncomesTable incomes={incomes} />);

    const rows = screen.getAllByRole('row').slice(1);
    const firstRow = rows[0];

    // Invoice and description should show dash
    const cells = within(firstRow).getAllByRole('cell');
    expect(cells[1]).toHaveTextContent('—'); // invoice column
    expect(cells[3]).toHaveTextContent('—'); // description column
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    const incomes: IncomeResponseDto[] = [createIncome({ id: '1', description: 'Test income' })];

    render(<IncomesTable incomes={incomes} onEdit={onEdit} />);

    const editButton = screen.getByRole('button', { name: /edit income/i });
    await user.click(editButton);

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledWith(incomes[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    const incomes: IncomeResponseDto[] = [createIncome({ id: '1', description: 'Test income' })];

    render(<IncomesTable incomes={incomes} onDelete={onDelete} />);

    const deleteButton = screen.getByRole('button', { name: /delete income/i });
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(incomes[0]);
  });

  it('calls onTogglePaid when paid badge is clicked', async () => {
    const user = userEvent.setup();
    const onTogglePaid = vi.fn();

    const incomes: IncomeResponseDto[] = [createIncome({ id: '1', isPaid: false })];

    render(<IncomesTable incomes={incomes} onTogglePaid={onTogglePaid} />);

    // The button's accessible name is the text content "Unpaid", not the title
    const rows = screen.getAllByRole('row').slice(1);
    const paidButton = within(rows[0]).getByRole('button', { name: /unpaid/i });
    await user.click(paidButton);

    expect(onTogglePaid).toHaveBeenCalledTimes(1);
    expect(onTogglePaid).toHaveBeenCalledWith(incomes[0]);
  });

  it('displays paid badge in green for paid incomes', () => {
    const incomes: IncomeResponseDto[] = [createIncome({ id: '1', isPaid: true })];

    render(<IncomesTable incomes={incomes} />);

    const rows = screen.getAllByRole('row').slice(1);
    const paidBadge = within(rows[0]).getByText('Paid');
    expect(paidBadge).toHaveClass('bg-emerald-100', 'text-emerald-700');
  });

  it('displays unpaid badge in amber for unpaid incomes', () => {
    const incomes: IncomeResponseDto[] = [createIncome({ id: '1', isPaid: false })];

    render(<IncomesTable incomes={incomes} />);

    const rows = screen.getAllByRole('row').slice(1);
    const unpaidBadge = within(rows[0]).getByText('Unpaid');
    expect(unpaidBadge).toHaveClass('bg-amber-100', 'text-amber-700');
  });

  it('shows non-clickable badge when onTogglePaid is not provided', () => {
    const incomes: IncomeResponseDto[] = [createIncome({ id: '1', isPaid: false })];

    render(<IncomesTable incomes={incomes} />);

    const rows = screen.getAllByRole('row').slice(1);
    const badge = within(rows[0]).getByText('Unpaid');
    expect(badge.tagName).toBe('SPAN'); // Not a button
  });

  describe('Pagination', () => {
    it('shows pagination controls when incomes exceed 25', () => {
      const incomes: IncomeResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument();
      expect(screen.getByText(/showing 1-25 of 30/i)).toBeInTheDocument();
    });

    it('hides pagination controls when incomes are 25 or fewer', () => {
      const incomes: IncomeResponseDto[] = Array.from({ length: 25 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      expect(screen.queryByRole('button', { name: /previous page/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /next page/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
    });

    it('navigates to next page when Next button is clicked', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(screen.getByText(/showing 26-30 of 30/i)).toBeInTheDocument();
    });

    it('navigates to previous page when Previous button is clicked', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      await user.click(prevButton);

      expect(screen.getByText(/showing 1-25 of 30/i)).toBeInTheDocument();
    });

    it('disables Previous button on first page', () => {
      const incomes: IncomeResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      const prevButton = screen.getByRole('button', { name: /previous page/i });
      expect(prevButton).toBeDisabled();
    });

    it('disables Next button on last page', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      expect(nextButton).toBeDisabled();
    });

    it('shows correct page indicator for multiple pages', () => {
      const incomes: IncomeResponseDto[] = Array.from({ length: 100 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-01-01T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      expect(screen.getByText(/page 1 of 4/i)).toBeInTheDocument();
    });

    it('displays only current page rows (25 per page)', () => {
      const incomes: IncomeResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      const rows = screen.getAllByRole('row').slice(1); // skip header
      expect(rows).toHaveLength(25);
    });

    it('handles zero amount incomes correctly in pagination', () => {
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: '1', totalCents: 0, subtotalCents: 0, gstCents: 0 }),
        ...Array.from({ length: 29 }, (_, i) =>
          createIncome({ id: `income-${i + 2}`, totalCents: (i + 1) * 1000 }),
        ),
      ];

      render(<IncomesTable incomes={incomes} />);

      expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0);
      expect(screen.getByText(/showing 1-25 of 30/i)).toBeInTheDocument();
    });

    it('preserves sorting when navigating between pages', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      // Sort by total ascending
      const totalHeaderButton = screen.getByRole('button', { name: /total/i });
      await user.click(totalHeaderButton);

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next page/i });
      await user.click(nextButton);

      // Verify page 2 still shows sorted data (totals 26-30)
      const rows = screen.getAllByRole('row').slice(1);
      expect(within(rows[0]).getByText(/\$260\.00/)).toBeInTheDocument();
    });

    it('has proper ARIA labels on pagination controls', () => {
      const incomes: IncomeResponseDto[] = Array.from({ length: 30 }, (_, i) =>
        createIncome({ id: `income-${i}`, date: `2025-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`, totalCents: (i + 1) * 1000 }),
      );

      render(<IncomesTable incomes={incomes} />);

      expect(screen.getByRole('button', { name: /previous page/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /next page/i })).toHaveAttribute('aria-label');
    });
  });

  describe('Bulk Operations', () => {
    it('shows selection checkboxes when onBulkDelete is provided', () => {
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('does not show selection checkboxes when onBulkDelete is not provided', () => {
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
      ];

      render(<IncomesTable incomes={incomes} />);

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('selects individual row when checkbox is clicked', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      await user.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('selects all rows when "Select All" is clicked', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
        createIncome({ id: 'inc-3', description: 'Test Income 3' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      await user.click(selectAllButton);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });

    it('deselects all rows when "Select None" is clicked', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const selectAllButton = screen.getByRole('button', { name: /select all/i });
      await user.click(selectAllButton);

      const selectNoneButton = screen.getByRole('button', { name: /select none/i });
      await user.click(selectNoneButton);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('inverts selection when "Invert" is clicked', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
        createIncome({ id: 'inc-3', description: 'Test Income 3' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      const invertButton = screen.getByRole('button', { name: /invert/i });
      await user.click(invertButton);

      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
      expect(checkboxes[2]).toBeChecked();
    });

    it('shows selected count in toolbar', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
        createIncome({ id: 'inc-3', description: 'Test Income 3' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[1]);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it('calls onBulkDelete with selected IDs when delete button is clicked', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
        createIncome({ id: 'inc-3', description: 'Test Income 3' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      await user.click(checkboxes[0]);
      await user.click(checkboxes[2]);

      const deleteButton = screen.getByRole('button', { name: /delete selected/i });
      await user.click(deleteButton);

      expect(onBulkDelete).toHaveBeenCalledWith(['inc-1', 'inc-3']);
    });

    it('calls onBulkExport with selected incomes when export button is clicked', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1', totalCents: 5000 }),
        createIncome({ id: 'inc-2', description: 'Test Income 2', totalCents: 10000 }),
      ];

      const onBulkExport = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkExport={onBulkExport} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      await user.click(checkboxes[0]);

      const exportButton = screen.getByRole('button', { name: /export selected/i });
      await user.click(exportButton);

      expect(onBulkExport).toHaveBeenCalledWith([incomes[0]]);
    });

    it('hides bulk action buttons when no rows are selected', () => {
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
      ];

      const onBulkDelete = vi.fn();
      const onBulkExport = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} onBulkExport={onBulkExport} />);

      const deleteButton = screen.queryByRole('button', { name: /delete selected/i });
      const exportButton = screen.queryByRole('button', { name: /export selected/i });

      expect(deleteButton).not.toBeInTheDocument();
      expect(exportButton).not.toBeInTheDocument();
    });

    it('shows bulk action toolbar only when rows are selected', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      await user.click(checkboxes[0]);

      expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    });

    it('supports shift-click for range selection', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
        createIncome({ id: 'inc-3', description: 'Test Income 3' }),
        createIncome({ id: 'inc-4', description: 'Test Income 4' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      await user.click(checkboxes[0]);
      await user.keyboard('{Shift>}');
      await user.click(checkboxes[2]);
      await user.keyboard('{/Shift}');

      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).toBeChecked();
      expect(checkboxes[3]).not.toBeChecked();
    });

    it('clears selection after bulk delete', async () => {
      const user = userEvent.setup();
      const incomes: IncomeResponseDto[] = [
        createIncome({ id: 'inc-1', description: 'Test Income 1' }),
        createIncome({ id: 'inc-2', description: 'Test Income 2' }),
      ];

      const onBulkDelete = vi.fn();
      render(<IncomesTable incomes={incomes} onBulkDelete={onBulkDelete} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select income/i });
      await user.click(checkboxes[0]);

      const deleteButton = screen.getByRole('button', { name: /delete selected/i });
      await user.click(deleteButton);

      expect(screen.queryByText(/selected/i)).not.toBeInTheDocument();
    });
  });
});
