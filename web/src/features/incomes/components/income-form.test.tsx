import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ClientDto } from '@/lib/api-client';
import { IncomeForm } from '@/features/incomes/components/income-form';
import { useCreateIncome, useUpdateIncome } from '@/features/incomes/hooks/use-income-mutations';

vi.mock('@/features/incomes/hooks/use-income-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseCreateIncome = vi.mocked(useCreateIncome);
const mockedUseUpdateIncome = vi.mocked(useUpdateIncome);

describe('IncomeForm', () => {
  const mockClients: ClientDto[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Acme Corp',
      abn: '51824753556',
      isPsiEligible: false,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      name: 'TechStart Ltd',
      abn: '12345678901',
      isPsiEligible: true,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ];

  it('submits form and calls create mutation with correct payload', async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockedUseCreateIncome.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    render(<IncomeForm clients={mockClients} />);

    const dateInput = screen.getByLabelText('Date');
    const subtotalInput = screen.getByLabelText('Subtotal (AUD)');
    const gstInput = screen.getByLabelText('GST (AUD)');
    const clientSelect = screen.getByLabelText('Client');

    await user.type(dateInput, '2025-08-15');
    await user.type(subtotalInput, '1000');
    await user.clear(gstInput); // Clear auto-calculated GST
    await user.type(gstInput, '100');
    await user.selectOptions(clientSelect, '550e8400-e29b-41d4-a716-446655440000');

    const submitButton = screen.getByRole('button', { name: 'Save income' });
    await user.click(submitButton);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      {
        data: {
          date: '2025-08-15',
          clientId: '550e8400-e29b-41d4-a716-446655440000',
          subtotalCents: 100000,
          gstCents: 10000,
          isPaid: false,
        },
      },
      expect.any(Object),
    );
  });

  it('auto-calculates GST as 10% of subtotal', async () => {
    const user = userEvent.setup();

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    render(<IncomeForm clients={mockClients} />);

    const subtotalInput = screen.getByLabelText('Subtotal (AUD)');
    const gstInput = screen.getByLabelText('GST (AUD)');

    await user.type(subtotalInput, '1000');

    // Wait for auto-calculation
    await waitFor(() => {
      expect(gstInput).toHaveValue('$100.00');
    });
  });

  it('allows manual override of GST and stops auto-calculation', async () => {
    const user = userEvent.setup();

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    render(<IncomeForm clients={mockClients} />);

    const subtotalInput = screen.getByLabelText('Subtotal (AUD)');
    const gstInput = screen.getByLabelText('GST (AUD)');

    // Type subtotal - GST should auto-calculate
    await user.type(subtotalInput, '1000');
    await waitFor(() => {
      expect(gstInput).toHaveValue('$100.00');
    });

    // Manually edit GST by focusing on it
    await user.click(gstInput);
    await user.clear(gstInput);
    await user.type(gstInput, '150');

    // Change subtotal again - GST should NOT auto-update
    await user.clear(subtotalInput);
    await user.type(subtotalInput, '2000');

    // GST should still be 150 (manually entered), not auto-calculated to $200.00
    await waitFor(() => {
      expect(gstInput).toHaveValue('150');
    });
  });

  it('includes optional fields in payload when provided', async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockedUseCreateIncome.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    render(<IncomeForm clients={mockClients} />);

    const dateInput = screen.getByLabelText('Date');
    const invoiceInput = screen.getByLabelText('Invoice number (optional)');
    const descriptionInput = screen.getByLabelText('Description (optional)');
    const subtotalInput = screen.getByLabelText('Subtotal (AUD)');
    const gstInput = screen.getByLabelText('GST (AUD)');
    const isPaidCheckbox = screen.getByLabelText('Mark as paid');

    await user.type(dateInput, '2025-08-15');
    await user.type(invoiceInput, 'INV-2024-001');
    await user.type(descriptionInput, 'Web development services');
    await user.type(subtotalInput, '5000');
    await user.clear(gstInput);
    await user.type(gstInput, '500');
    await user.click(isPaidCheckbox);

    const submitButton = screen.getByRole('button', { name: 'Save income' });
    await user.click(submitButton);

    expect(mutate).toHaveBeenCalledWith(
      {
        data: {
          date: '2025-08-15',
          clientId: expect.any(String),
          subtotalCents: 500000,
          gstCents: 50000,
          isPaid: true,
          invoiceNum: 'INV-2024-001',
          description: 'Web development services',
        },
      },
      expect.any(Object),
    );
  });

  it('auto-selects first client when none selected', async () => {
    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    render(<IncomeForm clients={mockClients} />);

    const clientSelect = screen.getByLabelText('Client');

    // First client should be auto-selected
    await waitFor(() => {
      expect(clientSelect.value).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();

    mockedUseCreateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateIncome>);

    mockedUseUpdateIncome.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateIncome>);

    render(<IncomeForm clients={mockClients} />);

    const submitButton = screen.getByRole('button', { name: 'Save income' });
    await user.click(submitButton);

    // Should show validation errors (exact text depends on schema)
    await waitFor(() => {
      expect(screen.getByText(/date is required/i)).toBeInTheDocument();
    });
  });
});
