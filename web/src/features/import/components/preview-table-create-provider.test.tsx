import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/toast-provider';
import { PreviewTable } from './preview-table';
import type { components } from '@shared/types';

// Mock the CreateProviderModal component
vi.mock('./create-provider-modal', () => ({
  CreateProviderModal: ({ isOpen, suggestedName }: { isOpen: boolean; suggestedName?: string }) => {
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-labelledby="create-provider-title">
        <h2 id="create-provider-title">Create New Provider</h2>
        {suggestedName && <p>Suggested: {suggestedName}</p>}
      </div>
    );
  },
}));

type CsvRowResultDto = components['schemas']['CsvRowResultDto'];

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

describe('PreviewTable - Create Provider Feature', () => {
  describe('Provider name extraction from errors', () => {
    it('extracts provider name from "No matching provider found for" error', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching provider found for "Office Supplies Depot"',
        },
      ];

      renderWithProviders(<PreviewTable rows={rows} />);

      expect(screen.getByText(/No matching provider found for "Office Supplies Depot"/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Provider/i })).toBeInTheDocument();
    });

    it('extracts provider name with special characters', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching provider found for "GitHub, Inc."',
        },
      ];

      renderWithProviders(<PreviewTable rows={rows} />);

      expect(screen.getByRole('button', { name: /Create Provider/i })).toBeInTheDocument();
    });

    it('does not show Create Provider button for other errors', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'Invalid date format',
        },
      ];

      renderWithProviders(<PreviewTable rows={rows} />);

      expect(screen.queryByRole('button', { name: /Create Provider/i })).not.toBeInTheDocument();
    });

    it('does not show Create Provider button for category errors', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching category found for "Software"',
        },
      ];

      renderWithProviders(<PreviewTable rows={rows} />);

      expect(screen.queryByRole('button', { name: /Create Provider/i })).not.toBeInTheDocument();
    });
  });

  describe('Create Provider button functionality', () => {
    it('shows Create Provider button for each provider-not-found error', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching provider found for "Provider A"',
        },
        {
          rowNumber: 2,
          success: false,
          error: 'No matching provider found for "Provider B"',
        },
        {
          rowNumber: 3,
          success: false,
          error: 'Invalid amount',
        },
      ];

      renderWithProviders(<PreviewTable rows={rows} />);

      const createButtons = screen.getAllByRole('button', { name: /Create Provider/i });
      expect(createButtons).toHaveLength(2); // Only 2 provider errors
    });

    it('calls onProviderCreated callback when provided', async () => {
      const user = userEvent.setup();
      const onProviderCreated = vi.fn();

      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching provider found for "Test Provider"',
        },
      ];

      renderWithProviders(
        <PreviewTable rows={rows} onProviderCreated={onProviderCreated} />,
      );

      const createButton = screen.getByRole('button', { name: /Create Provider/i });
      await user.click(createButton);

      // Modal should open (we're not testing the modal itself here)
      expect(screen.getByRole('dialog', { name: /Create New Provider/i })).toBeInTheDocument();
    });
  });

  describe('Error display with Create Provider buttons', () => {
    it('displays error message alongside Create Provider button', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 5,
          success: false,
          error: 'No matching provider found for "Cloud Services Inc"',
        },
      ];

      renderWithProviders(<PreviewTable rows={rows} />);

      expect(screen.getByText(/Row 5:/)).toBeInTheDocument();
      expect(screen.getByText(/No matching provider found for "Cloud Services Inc"/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Provider/i })).toBeInTheDocument();
    });

    it('handles multiple errors of different types correctly', () => {
      const rows: CsvRowResultDto[] = [
        {
          rowNumber: 1,
          success: false,
          error: 'No matching provider found for "Provider 1"',
        },
        {
          rowNumber: 2,
          success: false,
          error: 'Invalid date format',
        },
        {
          rowNumber: 3,
          success: false,
          error: 'No matching provider found for "Provider 2"',
        },
      ];

      renderWithProviders(<PreviewTable rows={rows} />);

      // Only 2 Create Provider buttons for the 2 provider errors
      const createButtons = screen.getAllByRole('button', { name: /Create Provider/i });
      expect(createButtons).toHaveLength(2);

      // All errors should be displayed
      expect(screen.getByText(/Row 1:/)).toBeInTheDocument();
      expect(screen.getByText(/Row 2:/)).toBeInTheDocument();
      expect(screen.getByText(/Row 3:/)).toBeInTheDocument();
    });
  });
});
