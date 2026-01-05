import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IncomePreviewTable } from './income-preview-table';
import type { components } from '@shared/types';

type BaseCsvRowResultDto = components['schemas']['CsvRowResultDto'];

// Extend CsvRowResultDto to include income-specific fields
type CsvRowResultDto = BaseCsvRowResultDto & {
  clientName?: string;
  subtotalCents?: number;
  totalCents?: number;
  invoiceNumber?: string;
  isPaid?: boolean;
};

describe('IncomePreviewTable', () => {
  it('renders empty state when no rows provided', () => {
    render(<IncomePreviewTable rows={[]} />);

    expect(screen.getByText(/no rows to preview/i)).toBeInTheDocument();
  });

  it('renders table headers correctly for income import', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        clientName: 'Acme Corp',
        matchScore: 0.95,
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
      },
    ];

    render(<IncomePreviewTable rows={rows} />);

    expect(screen.getByText('Row')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Invoice #')).toBeInTheDocument();
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('GST')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('displays successful row with client match', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        clientName: 'Acme Corp',
        matchScore: 0.95,
        invoiceNumber: 'INV-001',
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
        isPaid: true,
      },
    ];

    render(<IncomePreviewTable rows={rows} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/success/i)).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('INV-001')).toBeInTheDocument();
    expect(screen.getByText('$1000.00')).toBeInTheDocument(); // subtotalCents / 100
    expect(screen.getByText('$100.00')).toBeInTheDocument(); // gstCents / 100
    expect(screen.getByText('$1100.00')).toBeInTheDocument(); // totalCents / 100
  });

  it('displays failed row with error message', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 2,
        success: false,
        error: 'Invalid date format',
      },
    ];

    render(<IncomePreviewTable rows={rows} />);

    expect(screen.getByText('2')).toBeInTheDocument();

    // Check for Error status badge
    const statusCell = screen.getByText('Error');
    expect(statusCell).toBeInTheDocument();
    expect(statusCell).toHaveClass('text-red-400');

    // Check error message appears in errors section
    expect(screen.getByText('Invalid date format')).toBeInTheDocument();
    expect(screen.getByText(/Row 2:/)).toBeInTheDocument();
  });

  it('displays duplicate row with warning badge', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 3,
        success: true,
        isDuplicate: true,
        clientName: 'XYZ Ltd',
        subtotalCents: 50000,
        gstCents: 5000,
        totalCents: 55000,
      },
    ];

    render(<IncomePreviewTable rows={rows} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/duplicate/i)).toBeInTheDocument();
    expect(screen.getByText('XYZ Ltd')).toBeInTheDocument();
  });

  it('displays high confidence badge for exact client match', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        clientName: 'Acme Corp',
        matchScore: 1.0,
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
      },
    ];

    render(<IncomePreviewTable rows={rows} />);

    // High confidence (>= 80%) shows in emerald/green
    const badge = screen.getByText('100%');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-emerald-400');
  });

  it('displays medium confidence badge for fuzzy client match', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        clientName: 'ABC Pty Ltd',
        matchScore: 0.65,
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
      },
    ];

    render(<IncomePreviewTable rows={rows} />);

    // Medium confidence (50-79%) shows in amber/yellow
    const badge = screen.getByText('65%');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-amber-400');
  });

  it('displays low confidence badge for poor client match', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        clientName: 'New Client',
        matchScore: 0.3,
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
      },
    ];

    render(<IncomePreviewTable rows={rows} />);

    // Low confidence (< 50%) shows in red
    const badge = screen.getByText('30%');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-red-400');
  });

  it('handles missing optional fields gracefully', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        clientName: 'Minimal Data Corp',
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
        // No invoiceNumber, matchScore, description
      },
    ];

    render(<IncomePreviewTable rows={rows} />);

    expect(screen.getByText('Minimal Data Corp')).toBeInTheDocument();
    // Should show dashes for missing fields
    expect(screen.getAllByText('-').length).toBeGreaterThan(0);
  });

  describe('Row Selection', () => {
    it('renders checkboxes when selectable prop is true', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: true,
          clientName: 'Acme Corp',
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
        },
      ];

      render(<IncomePreviewTable rows={rows} selectable={true} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('calls onSelectionChange when row checkbox is clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: true,
          clientName: 'Acme Corp',
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
        },
      ];

      render(
        <IncomePreviewTable
          rows={rows}
          selectable={true}
          selectedRows={new Set()}
          onSelectionChange={onSelectionChange}
        />,
      );

      const checkbox = screen.getByLabelText('Select row 1');
      await user.click(checkbox);

      expect(onSelectionChange).toHaveBeenCalledWith(new Set([1]));
    });

    it('disables checkbox for failed rows', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'Invalid data',
        },
      ];

      render(<IncomePreviewTable rows={rows} selectable={true} />);

      const checkbox = screen.getByLabelText('Select row 1');
      expect(checkbox).toBeDisabled();
    });

    it('toggles all selectable rows when header checkbox is clicked', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: true,
          clientName: 'Client A',
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
        },
        {
          rowNumber: 2,
          success: false,
          error: 'Invalid',
        },
        {
          rowNumber: 3,
          success: true,
          clientName: 'Client B',
          subtotalCents: 200000,
          gstCents: 20000,
          totalCents: 220000,
        },
      ];

      render(
        <IncomePreviewTable
          rows={rows}
          selectable={true}
          selectedRows={new Set()}
          onSelectionChange={onSelectionChange}
        />,
      );

      const headerCheckbox = screen.getByLabelText('Select all rows');
      await user.click(headerCheckbox);

      // Should select only successful rows (1 and 3, not 2)
      expect(onSelectionChange).toHaveBeenCalledWith(new Set([1, 3]));
    });

    it('displays selection count when rows are selected', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: true,
          clientName: 'Client A',
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
        },
        {
          rowNumber: 2,
          success: true,
          clientName: 'Client B',
          subtotalCents: 200000,
          gstCents: 20000,
          totalCents: 220000,
        },
      ];

      render(<IncomePreviewTable rows={rows} selectable={true} selectedRows={new Set([1, 2])} />);

      expect(screen.getByText('2 of 2 rows selected')).toBeInTheDocument();
    });
  });

  it('applies background colors for row states', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        clientName: 'Success Row',
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
      },
      {
        rowNumber: 2,
        success: false,
        error: 'Error Row',
      },
      {
        rowNumber: 3,
        success: true,
        isDuplicate: true,
        clientName: 'Duplicate Row',
        subtotalCents: 100000,
        gstCents: 10000,
        totalCents: 110000,
      },
    ];

    const { container } = render(<IncomePreviewTable rows={rows} />);

    const tableRows = container.querySelectorAll('tbody tr');
    expect(tableRows[0]).not.toHaveClass('bg-red-950/30', 'bg-amber-950/30'); // Success - no bg
    expect(tableRows[1]).toHaveClass('bg-red-950/30'); // Error - red bg
    expect(tableRows[2]).toHaveClass('bg-amber-950/30'); // Duplicate - amber bg
  });
});
