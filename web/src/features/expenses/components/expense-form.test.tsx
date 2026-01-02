import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryDto, ProviderDto } from '@/lib/api-client';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useCreateExpense } from '@/features/expenses/hooks/use-expense-mutations';

vi.mock('@/features/expenses/hooks/use-expense-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseCreateExpense = vi.mocked(
  useCreateExpense as () => {
    mutate: (variables: unknown, options?: unknown) => void;
    isPending: boolean;
  },
);

describe('ExpenseForm', () => {
  it('submits form and calls create mutation', async () => {
    const user = userEvent.setup();

    const providers: ProviderDto[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Provider A',
        isInternational: false,
        defaultCategoryId: null,
        abnArn: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    const categories: CategoryDto[] = [
      {
        id: '660e8400-e29b-41d4-a716-446655440000',
        name: 'Category A',
        basLabel: '1B',
        isDeductible: true,
        description: null,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    const mutate = vi.fn();

    mockedUseCreateExpense.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateExpense>);

    render(<ExpenseForm providers={providers} categories={categories} />);

    const dateInput = screen.getByLabelText('Date');
    const amountInput = screen.getByLabelText('Amount (AUD)');
    const bizPercentInput = screen.getByLabelText('Business use %');
    const providerSelect = screen.getByLabelText('Provider');
    const categorySelect = screen.getByLabelText('Category');

    await user.type(dateInput, '2025-08-15');
    await user.type(amountInput, '110');
    await user.clear(bizPercentInput);
    await user.type(bizPercentInput, '100');

    await user.selectOptions(providerSelect, '550e8400-e29b-41d4-a716-446655440000');
    await user.selectOptions(categorySelect, '660e8400-e29b-41d4-a716-446655440000');

    const submitButton = screen.getByRole('button', { name: 'Save expense' });
    await user.click(submitButton);

    expect(mutate).toHaveBeenCalledTimes(1);
  });
});
