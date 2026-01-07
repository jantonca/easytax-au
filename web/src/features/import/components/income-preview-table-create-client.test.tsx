import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast-provider';
import { IncomePreviewTable } from './income-preview-table';
import type { components } from '@shared/types';

// Mock the CreateClientModal component
vi.mock('./create-client-modal', () => ({
  CreateClientModal: ({ isOpen, suggestedName }: { isOpen: boolean; suggestedName?: string }) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-labelledby="create-client-title">
        <h2 id="create-client-title">Create New Client</h2>
        {suggestedName && <p>Suggested: {suggestedName}</p>}
      </div>
    );
  },
}));

type BaseCsvRowResultDto = components['schemas']['CsvRowResultDto'];

type CsvRowResultDto = BaseCsvRowResultDto & {
  clientName?: string;
  subtotalCents?: number;
  totalCents?: number;
  invoiceNum?: string;
  date?: string;
  description?: string;
  isPaid?: boolean;
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{ui}</ToastProvider>
    </QueryClientProvider>,
  );
}

describe('IncomePreviewTable - Create Client Feature', () => {
  describe('Client name extraction from errors', () => {
    it('extracts client name from "No matching client found for" error', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching client found for "Acme Corporation"',
        },
      ];

      renderWithProviders(<IncomePreviewTable rows={rows} />);

      expect(screen.getByText(/No matching client found for "Acme Corporation"/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Client/i })).toBeInTheDocument();
    });

    it('extracts client name with special characters', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching client found for "O\'Reilly Media, Inc."',
        },
      ];

      renderWithProviders(<IncomePreviewTable rows={rows} />);

      expect(screen.getByRole('button', { name: /Create Client/i })).toBeInTheDocument();
    });

    it('does not show Create Client button for other errors', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'Invalid invoice number',
        },
      ];

      renderWithProviders(<IncomePreviewTable rows={rows} />);

      expect(screen.queryByRole('button', { name: /Create Client/i })).not.toBeInTheDocument();
    });

    it('does not show Create Client button for validation errors', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'Total amount mismatch: subtotal + GST != total',
        },
      ];

      renderWithProviders(<IncomePreviewTable rows={rows} />);

      expect(screen.queryByRole('button', { name: /Create Client/i })).not.toBeInTheDocument();
    });
  });

  describe('Create Client button functionality', () => {
    it('shows Create Client button for each client-not-found error', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching client found for "Client A"',
        },
        {
          rowNumber: 2,
          success: false,
          error: 'No matching client found for "Client B"',
        },
        {
          rowNumber: 3,
          success: false,
          error: 'Invalid date format',
        },
      ];

      renderWithProviders(<IncomePreviewTable rows={rows} />);

      const createButtons = screen.getAllByRole('button', { name: /Create Client/i });
      expect(createButtons).toHaveLength(2); // Only 2 client errors
    });

    it('calls onClientCreated callback when provided', async () => {
      const user = userEvent.setup();
      const onClientCreated = vi.fn();

      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching client found for "Test Client"',
        },
      ];

      renderWithProviders(<IncomePreviewTable rows={rows} onClientCreated={onClientCreated} />);

      const createButton = screen.getByRole('button', { name: /Create Client/i });
      await user.click(createButton);

      // Modal should open (we're not testing the modal itself here)
      expect(screen.getByRole('dialog', { name: /Create New Client/i })).toBeInTheDocument();
    });
  });

  describe('Error display with Create Client buttons', () => {
    it('displays error message alongside Create Client button', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 3,
          success: false,
          error: 'No matching client found for "Tech Startup Ltd"',
        },
      ];

      renderWithProviders(<IncomePreviewTable rows={rows} />);

      expect(screen.getByText(/Row 3:/)).toBeInTheDocument();
      expect(screen.getByText(/No matching client found for "Tech Startup Ltd"/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Client/i })).toBeInTheDocument();
    });

    it('handles multiple errors of different types correctly', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching client found for "Client 1"',
        },
        {
          rowNumber: 2,
          success: false,
          error: 'Invalid subtotal amount',
        },
        {
          rowNumber: 3,
          success: false,
          error: 'No matching client found for "Client 2"',
        },
      ];

      renderWithProviders(<IncomePreviewTable rows={rows} />);

      // Only 2 Create Client buttons for the 2 client errors
      const createButtons = screen.getAllByRole('button', { name: /Create Client/i });
      expect(createButtons).toHaveLength(2);

      // All errors should be displayed
      expect(screen.getByText(/Row 1:/)).toBeInTheDocument();
      expect(screen.getByText(/Row 2:/)).toBeInTheDocument();
      expect(screen.getByText(/Row 3:/)).toBeInTheDocument();
    });
  });
});
