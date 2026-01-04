import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
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
});
