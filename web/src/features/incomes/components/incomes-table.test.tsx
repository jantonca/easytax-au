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
});
