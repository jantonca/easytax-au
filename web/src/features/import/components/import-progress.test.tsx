import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportProgress } from './import-progress';
import type { components } from '@shared/types';

type CsvImportResponseDto = components['schemas']['CsvImportResponseDto'];

describe('ImportProgress', () => {
  it('renders loading state when importing', () => {
    render(<ImportProgress isLoading={true} data={undefined} error={null} />);

    expect(screen.getByText(/importing/i)).toBeInTheDocument();
    expect(screen.getByText(/please wait/i)).toBeInTheDocument();
  });

  it('displays success summary with statistics', () => {
    const data: CsvImportResponseDto = {
      importJobId: '123e4567-e89b-12d3-a456-426614174000',
      totalRows: 10,
      successCount: 8,
      failedCount: 1,
      duplicateCount: 1,
      totalAmountCents: 125000,
      totalGstCents: 11363,
      processingTimeMs: 150,
      rows: [],
    };

    render(<ImportProgress isLoading={false} data={data} error={null} />);

    expect(screen.getByText(/import complete/i)).toBeInTheDocument();
    expect(screen.getByText(/successfully imported/i)).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText(/^failed$/i)).toBeInTheDocument();
    expect(screen.getByText(/duplicates skipped/i)).toBeInTheDocument();
  });

  it('displays total amount and GST', () => {
    const data: CsvImportResponseDto = {
      importJobId: 'test-id',
      totalRows: 5,
      successCount: 5,
      failedCount: 0,
      duplicateCount: 0,
      totalAmountCents: 125000,
      totalGstCents: 11363,
      processingTimeMs: 100,
      rows: [],
    };

    render(<ImportProgress isLoading={false} data={data} error={null} />);

    expect(screen.getByText(/\$1,250\.00/)).toBeInTheDocument();
    expect(screen.getByText(/\$113\.63/)).toBeInTheDocument();
  });

  it('displays error message when import fails', () => {
    const error = new Error('Invalid CSV format');

    render(<ImportProgress isLoading={false} data={undefined} error={error} />);

    expect(screen.getByText(/import failed/i)).toBeInTheDocument();
    expect(screen.getByText(/invalid csv format/i)).toBeInTheDocument();
  });

  it('shows failed rows details when present', () => {
    const data: CsvImportResponseDto = {
      importJobId: 'test-id',
      totalRows: 3,
      successCount: 1,
      failedCount: 2,
      duplicateCount: 0,
      totalAmountCents: 10000,
      totalGstCents: 909,
      processingTimeMs: 100,
      rows: [
        {
          rowNumber: 1,
          success: true,
          providerName: 'iinet',
          amountCents: 8999,
          gstCents: 818,
        },
        {
          rowNumber: 2,
          success: false,
          error: 'Invalid date format',
        },
        {
          rowNumber: 3,
          success: false,
          error: 'Amount is required',
        },
      ],
    };

    render(<ImportProgress isLoading={false} data={data} error={null} />);

    expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
    expect(screen.getByText(/row 2/i)).toBeInTheDocument();
    expect(screen.getByText(/row 3/i)).toBeInTheDocument();
  });

  it('provides action buttons after successful import', async () => {
    const user = userEvent.setup();
    const onViewExpenses = vi.fn();
    const onImportMore = vi.fn();

    const data: CsvImportResponseDto = {
      importJobId: 'test-id',
      totalRows: 5,
      successCount: 5,
      failedCount: 0,
      duplicateCount: 0,
      totalAmountCents: 50000,
      totalGstCents: 4545,
      processingTimeMs: 100,
      rows: [],
    };

    render(
      <ImportProgress
        isLoading={false}
        data={data}
        error={null}
        onViewExpenses={onViewExpenses}
        onImportMore={onImportMore}
      />,
    );

    const viewButton = screen.getByRole('button', { name: /view expenses/i });
    const importButton = screen.getByRole('button', { name: /import more/i });

    expect(viewButton).toBeInTheDocument();
    expect(importButton).toBeInTheDocument();

    await user.click(viewButton);
    expect(onViewExpenses).toHaveBeenCalledTimes(1);

    await user.click(importButton);
    expect(onImportMore).toHaveBeenCalledTimes(1);
  });

  it('hides duplicate count when zero', () => {
    const data: CsvImportResponseDto = {
      importJobId: 'test-id',
      totalRows: 5,
      successCount: 5,
      failedCount: 0,
      duplicateCount: 0,
      totalAmountCents: 50000,
      totalGstCents: 4545,
      processingTimeMs: 100,
      rows: [],
    };

    render(<ImportProgress isLoading={false} data={data} error={null} />);

    expect(screen.queryByText(/duplicate/i)).not.toBeInTheDocument();
  });

  it('displays processing time', () => {
    const data: CsvImportResponseDto = {
      importJobId: 'test-id',
      totalRows: 100,
      successCount: 100,
      failedCount: 0,
      duplicateCount: 0,
      totalAmountCents: 500000,
      totalGstCents: 45454,
      processingTimeMs: 2345,
      rows: [],
    };

    render(<ImportProgress isLoading={false} data={data} error={null} />);

    expect(screen.getByText(/2\.3.*seconds/i)).toBeInTheDocument();
  });

  it('handles zero amounts correctly', () => {
    const data: CsvImportResponseDto = {
      importJobId: 'test-id',
      totalRows: 1,
      successCount: 1,
      failedCount: 0,
      duplicateCount: 0,
      totalAmountCents: 0,
      totalGstCents: 0,
      processingTimeMs: 50,
      rows: [],
    };

    render(<ImportProgress isLoading={false} data={data} error={null} />);

    const zeroAmounts = screen.getAllByText(/\$0\.00/);
    expect(zeroAmounts).toHaveLength(2); // Total Amount and Total GST
  });
});
