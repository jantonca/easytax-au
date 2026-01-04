import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryBreakdown } from './category-breakdown';
import type { CategoryExpenseDto } from '@/lib/api-client';

const mockCategories: CategoryExpenseDto[] = [
  {
    categoryId: 1,
    name: 'Software',
    basLabel: '1B',
    totalCents: 500000,
    gstCents: 45454,
    count: 24,
  },
  {
    categoryId: 2,
    name: 'Hosting',
    basLabel: '1B',
    totalCents: 300000,
    gstCents: 27272,
    count: 12,
  },
  {
    categoryId: 3,
    name: 'Hardware',
    basLabel: 'G10',
    totalCents: 1000000,
    gstCents: 90909,
    count: 5,
  },
];

describe('CategoryBreakdown', () => {
  it('renders table with all categories', () => {
    render(<CategoryBreakdown categories={mockCategories} />);

    expect(screen.getByText('Software')).toBeInTheDocument();
    expect(screen.getByText('Hosting')).toBeInTheDocument();
    expect(screen.getByText('Hardware')).toBeInTheDocument();
  });

  it('sorts categories by total amount descending by default', () => {
    render(<CategoryBreakdown categories={mockCategories} />);

    const rows = screen.getAllByRole('row').slice(1, -1); // Skip header and totals row
    const firstRow = rows[0];
    const secondRow = rows[1];
    const thirdRow = rows[2];

    // Hardware ($10,000) should be first
    expect(within(firstRow).getByText('Hardware')).toBeInTheDocument();
    expect(within(firstRow).getByText('$10,000.00')).toBeInTheDocument();

    // Software ($5,000) should be second
    expect(within(secondRow).getByText('Software')).toBeInTheDocument();
    expect(within(secondRow).getByText('$5,000.00')).toBeInTheDocument();

    // Hosting ($3,000) should be third
    expect(within(thirdRow).getByText('Hosting')).toBeInTheDocument();
    expect(within(thirdRow).getByText('$3,000.00')).toBeInTheDocument();
  });

  it('displays BAS label badges for each category', () => {
    render(<CategoryBreakdown categories={mockCategories} />);

    const badges = screen.getAllByText('1B');
    expect(badges).toHaveLength(2); // Software and Hosting

    expect(screen.getByText('G10')).toBeInTheDocument(); // Hardware
  });

  it('displays formatted currency amounts', () => {
    render(<CategoryBreakdown categories={mockCategories} />);

    expect(screen.getByText('$5,000.00')).toBeInTheDocument(); // Software total
    expect(screen.getByText('$454.54')).toBeInTheDocument(); // Software GST
    expect(screen.getByText('$3,000.00')).toBeInTheDocument(); // Hosting total
    expect(screen.getByText('$272.72')).toBeInTheDocument(); // Hosting GST
  });

  it('displays expense counts for each category', () => {
    render(<CategoryBreakdown categories={mockCategories} />);

    const rows = screen.getAllByRole('row').slice(1, -1); // Skip header and totals
    const softwareRow = rows.find((row) => within(row).queryByText('Software'));
    const hostingRow = rows.find((row) => within(row).queryByText('Hosting'));
    const hardwareRow = rows.find((row) => within(row).queryByText('Hardware'));

    expect(within(softwareRow!).getByText('24')).toBeInTheDocument();
    expect(within(hostingRow!).getByText('12')).toBeInTheDocument();
    expect(within(hardwareRow!).getByText('5')).toBeInTheDocument();
  });

  it('displays totals row with correct calculations', () => {
    render(<CategoryBreakdown categories={mockCategories} />);

    const rows = screen.getAllByRole('row');
    const totalsRow = rows[rows.length - 1]; // Last row

    expect(within(totalsRow).getByText('Total')).toBeInTheDocument();
    expect(within(totalsRow).getByText('$18,000.00')).toBeInTheDocument(); // Total amount
    expect(within(totalsRow).getByText('$1,636.35')).toBeInTheDocument(); // Total GST
    expect(within(totalsRow).getByText('41')).toBeInTheDocument(); // Total count
  });

  it('renders empty state when no categories', () => {
    render(<CategoryBreakdown categories={[]} />);

    expect(screen.getByText('No expense categories found for this period.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('has proper table headers', () => {
    render(<CategoryBreakdown categories={mockCategories} />);

    expect(screen.getByRole('columnheader', { name: 'Category' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'BAS Label' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Total' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'GST Paid' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Count' })).toBeInTheDocument();
  });

  it('has proper ARIA label for accessibility', () => {
    render(<CategoryBreakdown categories={mockCategories} />);

    expect(screen.getByRole('region', { name: 'Expense breakdown by category' })).toBeInTheDocument();
  });

  it('handles single category', () => {
    const singleCategory: CategoryExpenseDto[] = [
      {
        categoryId: 1,
        name: 'Software',
        basLabel: '1B',
        totalCents: 100000,
        gstCents: 9090,
        count: 10,
      },
    ];

    render(<CategoryBreakdown categories={singleCategory} />);

    expect(screen.getByText('Software')).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    const totalsRow = rows[rows.length - 1];

    // Totals should match the single category
    expect(within(totalsRow).getByText('$1,000.00')).toBeInTheDocument();
    expect(within(totalsRow).getByText('$90.90')).toBeInTheDocument();
    expect(within(totalsRow).getByText('10')).toBeInTheDocument();
  });

  it('handles categories with zero GST', () => {
    const categoriesWithZeroGst: CategoryExpenseDto[] = [
      {
        categoryId: 1,
        name: 'International Service',
        basLabel: '1B',
        totalCents: 50000,
        gstCents: 0,
        count: 3,
      },
    ];

    render(<CategoryBreakdown categories={categoriesWithZeroGst} />);

    expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0); // GST amount
  });
});
