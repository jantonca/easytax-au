import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PreviewTable } from './preview-table';
import type { components } from '@shared/types';

type CsvRowResultDto = components['schemas']['CsvRowResultDto'];

describe('PreviewTable', () => {
  it('renders empty state when no rows provided', () => {
    render(<PreviewTable rows={[]} />);

    expect(screen.getByText(/no rows to preview/i)).toBeInTheDocument();
  });

  it('renders table headers correctly', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        providerName: 'iinet',
        matchScore: 0.95,
        amountCents: 8999,
        gstCents: 818,
      },
    ];

    render(<PreviewTable rows={rows} />);

    expect(screen.getByText('Row')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Provider')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Amount')).toBeInTheDocument();
    expect(screen.getByText('GST')).toBeInTheDocument();
  });

  it('displays successful row with provider match', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        providerName: 'iinet',
        matchScore: 0.95,
        categoryName: 'Internet',
        amountCents: 8999,
        gstCents: 818,
      },
    ];

    render(<PreviewTable rows={rows} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/success/i)).toBeInTheDocument();
    expect(screen.getByText('iinet')).toBeInTheDocument();
    expect(screen.getByText('Internet')).toBeInTheDocument();
    expect(screen.getByText('$89.99')).toBeInTheDocument(); // amountCents / 100
    expect(screen.getByText('$8.18')).toBeInTheDocument(); // gstCents / 100
  });

  it('displays failed row with error message', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 2,
        success: false,
        error: 'Invalid date format',
      },
    ];

    render(<PreviewTable rows={rows} />);

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
        providerName: 'GitHub',
        amountCents: 2000,
        gstCents: 0,
      },
    ];

    render(<PreviewTable rows={rows} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(/duplicate/i)).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  it('displays provider match confidence scores', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        providerName: 'iinet',
        matchScore: 0.95,
        amountCents: 8999,
      },
      {
        rowNumber: 2,
        success: true,
        providerName: 'GitHub',
        matchScore: 0.65,
        amountCents: 2000,
      },
      {
        rowNumber: 3,
        success: true,
        providerName: 'Unknown',
        matchScore: 0.3,
        amountCents: 1000,
      },
    ];

    render(<PreviewTable rows={rows} />);

    // High confidence (>= 0.8)
    expect(screen.getByText(/95%/)).toBeInTheDocument();

    // Medium confidence (0.5 - 0.79)
    expect(screen.getByText(/65%/)).toBeInTheDocument();

    // Low confidence (< 0.5)
    expect(screen.getByText(/30%/)).toBeInTheDocument();
  });

  it('handles missing optional fields gracefully', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        // No provider, category, or GST
        amountCents: 10000,
      },
    ];

    render(<PreviewTable rows={rows} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();

    // Should have "-" for provider, category, and GST
    const emptyFields = screen.getAllByText('-');
    expect(emptyFields.length).toBeGreaterThanOrEqual(2); // At least provider and GST
  });

  it('formats zero amounts correctly', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        amountCents: 0,
        gstCents: 0,
      },
    ];

    render(<PreviewTable rows={rows} />);

    expect(screen.getAllByText('$0.00')).toHaveLength(2); // Amount and GST
  });

  it('displays multiple rows correctly', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        providerName: 'iinet',
        amountCents: 8999,
      },
      {
        rowNumber: 2,
        success: false,
        error: 'Invalid date',
      },
      {
        rowNumber: 3,
        success: true,
        isDuplicate: true,
        providerName: 'GitHub',
        amountCents: 2000,
      },
    ];

    render(<PreviewTable rows={rows} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies correct styling for different row states', () => {
    const rows: CsvRowResultDto[] = [
      {
        rowNumber: 1,
        success: true,
        amountCents: 1000,
      },
      {
        rowNumber: 2,
        success: false,
        error: 'Error',
      },
      {
        rowNumber: 3,
        success: true,
        isDuplicate: true,
        amountCents: 1000,
      },
    ];

    const { container } = render(<PreviewTable rows={rows} />);

    const tableRows = container.querySelectorAll('tbody tr');

    // Success row - default styling
    expect(tableRows[0]).not.toHaveClass('bg-red-950/30');
    expect(tableRows[0]).not.toHaveClass('bg-amber-950/30');

    // Error row - red background
    expect(tableRows[1]).toHaveClass('bg-red-950/30');

    // Duplicate row - amber background
    expect(tableRows[2]).toHaveClass('bg-amber-950/30');
  });

  // Row Selection Tests
  describe('Row Selection', () => {
    it('renders checkboxes for each row when selection enabled', () => {
      const rows: CsvRowResultDto[] = [
        { rowNumber: 1, success: true, amountCents: 1000 },
        { rowNumber: 2, success: true, amountCents: 2000 },
      ];

      render(<PreviewTable rows={rows} selectable onSelectionChange={vi.fn()} />);

      const checkboxes = screen.getAllByRole('checkbox');
      // Should have 2 row checkboxes + 1 "select all" checkbox
      expect(checkboxes).toHaveLength(3);
    });

    it('allows selecting and deselecting individual rows', async () => {
      const user = userEvent.setup();
      let currentSelection = new Set<number>();

      const rows: CsvRowResultDto[] = [
        { rowNumber: 1, success: true, amountCents: 1000 },
        { rowNumber: 2, success: true, amountCents: 2000 },
      ];

      const { rerender } = render(
        <PreviewTable
          rows={rows}
          selectable
          selectedRows={currentSelection}
          onSelectionChange={(selected) => {
            currentSelection = selected;
          }}
        />,
      );

      let checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      // Select first row
      await user.click(checkboxes[0]);
      rerender(
        <PreviewTable
          rows={rows}
          selectable
          selectedRows={currentSelection}
          onSelectionChange={(selected) => {
            currentSelection = selected;
          }}
        />,
      );
      expect(currentSelection).toEqual(new Set([1]));

      checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      // Select second row
      await user.click(checkboxes[1]);
      rerender(
        <PreviewTable
          rows={rows}
          selectable
          selectedRows={currentSelection}
          onSelectionChange={(selected) => {
            currentSelection = selected;
          }}
        />,
      );
      expect(currentSelection).toEqual(new Set([1, 2]));

      checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      // Deselect first row
      await user.click(checkboxes[0]);
      rerender(
        <PreviewTable
          rows={rows}
          selectable
          selectedRows={currentSelection}
          onSelectionChange={(selected) => {
            currentSelection = selected;
          }}
        />,
      );
      expect(currentSelection).toEqual(new Set([2]));
    });

    it('implements "Select All" functionality', async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();

      const rows: CsvRowResultDto[] = [
        { rowNumber: 1, success: true, amountCents: 1000 },
        { rowNumber: 2, success: true, amountCents: 2000 },
        { rowNumber: 3, success: true, amountCents: 3000 },
      ];

      render(<PreviewTable rows={rows} selectable onSelectionChange={onSelectionChange} />);

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });

      await user.click(selectAllCheckbox);
      expect(onSelectionChange).toHaveBeenCalledWith(new Set([1, 2, 3]));
    });

    it('implements "Deselect All" functionality', async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();

      const rows: CsvRowResultDto[] = [
        { rowNumber: 1, success: true, amountCents: 1000 },
        { rowNumber: 2, success: true, amountCents: 2000 },
      ];

      render(
        <PreviewTable
          rows={rows}
          selectable
          selectedRows={new Set([1, 2])}
          onSelectionChange={onSelectionChange}
        />,
      );

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });

      await user.click(selectAllCheckbox);
      expect(onSelectionChange).toHaveBeenCalledWith(new Set([]));
    });

    it('pre-selects valid rows and excludes error rows', () => {
      const rows: CsvRowResultDto[] = [
        { rowNumber: 1, success: true, amountCents: 1000 },
        { rowNumber: 2, success: false, error: 'Invalid' },
        { rowNumber: 3, success: true, amountCents: 3000 },
      ];

      render(
        <PreviewTable
          rows={rows}
          selectable
          selectedRows={new Set([1, 3])} // Error row 2 not selected
          onSelectionChange={vi.fn()}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      expect(checkboxes[0]).toBeChecked(); // Row 1
      expect(checkboxes[1]).not.toBeChecked(); // Row 2 (error)
      expect(checkboxes[2]).toBeChecked(); // Row 3
    });

    it('displays selection count', () => {
      const rows: CsvRowResultDto[] = [
        { rowNumber: 1, success: true, amountCents: 1000 },
        { rowNumber: 2, success: true, amountCents: 2000 },
        { rowNumber: 3, success: true, amountCents: 3000 },
      ];

      render(
        <PreviewTable
          rows={rows}
          selectable
          selectedRows={new Set([1, 3])}
          onSelectionChange={vi.fn()}
        />,
      );

      expect(screen.getByText(/2 of 3 rows selected/i)).toBeInTheDocument();
    });

    it('disables checkboxes for error rows', () => {
      const rows: CsvRowResultDto[] = [
        { rowNumber: 1, success: true, amountCents: 1000 },
        { rowNumber: 2, success: false, error: 'Invalid' },
      ];

      render(<PreviewTable rows={rows} selectable onSelectionChange={vi.fn()} />);

      const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i });

      expect(checkboxes[0]).not.toBeDisabled(); // Valid row
      expect(checkboxes[1]).toBeDisabled(); // Error row
    });

    it('allows selecting duplicate rows with warning', async () => {
      const onSelectionChange = vi.fn();
      const user = userEvent.setup();

      const rows: CsvRowResultDto[] = [
        { rowNumber: 1, success: true, isDuplicate: true, amountCents: 1000 },
      ];

      render(<PreviewTable rows={rows} selectable onSelectionChange={onSelectionChange} />);

      const checkbox = screen.getByRole('checkbox', { name: /select row 1/i });

      expect(checkbox).not.toBeDisabled(); // Duplicates are selectable
      await user.click(checkbox);
      expect(onSelectionChange).toHaveBeenCalledWith(new Set([1]));
    });
  });
});
