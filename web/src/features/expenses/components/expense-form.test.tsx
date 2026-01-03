import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryDto, ProviderDto } from '@/lib/api-client';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import {
  useCreateExpense,
  useUpdateExpense,
} from '@/features/expenses/hooks/use-expense-mutations';

vi.mock('@/features/expenses/hooks/use-expense-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseCreateExpense = vi.mocked(useCreateExpense);
const mockedUseUpdateExpense = vi.mocked(useUpdateExpense);

const mockProviders: ProviderDto[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'VentraIP',
    isInternational: false,
    defaultCategoryId: null,
    abnArn: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    name: 'GitHub',
    isInternational: true,
    defaultCategoryId: null,
    abnArn: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

const mockCategories: CategoryDto[] = [
  {
    id: '660e8400-e29b-41d4-a716-446655440000',
    name: 'Software',
    basLabel: '1B',
    isDeductible: true,
    description: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

describe('ExpenseForm', () => {
  it('submits form and calls create mutation', async () => {
    const user = userEvent.setup();

    const mutate = vi.fn();

    mockedUseCreateExpense.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateExpense>);

    mockedUseUpdateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateExpense>);

    render(<ExpenseForm providers={mockProviders} categories={mockCategories} />);

    const dateInput = screen.getByLabelText('Date');
    const amountInput = screen.getByLabelText('Amount (AUD)');
    const providerSelect = screen.getByLabelText('Provider');
    const categorySelect = screen.getByLabelText('Category');

    await user.type(dateInput, '2025-08-15');
    await user.type(amountInput, '110');

    await user.selectOptions(providerSelect, '550e8400-e29b-41d4-a716-446655440000');
    await user.selectOptions(categorySelect, '660e8400-e29b-41d4-a716-446655440000');

    const submitButton = screen.getByRole('button', { name: 'Save expense' });
    await user.click(submitButton);

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('calculates GST automatically for domestic provider', async () => {
    const user = userEvent.setup();

    mockedUseCreateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateExpense>);

    mockedUseUpdateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateExpense>);

    render(<ExpenseForm providers={mockProviders} categories={mockCategories} />);

    const amountInput = screen.getByLabelText('Amount (AUD)');
    const providerSelect = screen.getByLabelText('Provider');

    // Select domestic provider
    await user.selectOptions(providerSelect, '550e8400-e29b-41d4-a716-446655440000');

    // Enter amount: $110.00 should result in $10.00 GST (1/11)
    await user.type(amountInput, '110');

    // Should display calculated GST
    expect(screen.getByText(/calculated gst.*\$10\.00/i)).toBeInTheDocument();
  });

  it('shows zero GST for international provider', async () => {
    const user = userEvent.setup();

    mockedUseCreateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateExpense>);

    mockedUseUpdateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateExpense>);

    render(<ExpenseForm providers={mockProviders} categories={mockCategories} />);

    const amountInput = screen.getByLabelText('Amount (AUD)');
    const providerSelect = screen.getByLabelText('Provider');

    // Select international provider (GitHub)
    await user.selectOptions(providerSelect, '660e8400-e29b-41d4-a716-446655440001');

    // Enter amount
    await user.type(amountInput, '100');

    // Should display $0.00 GST for international
    expect(screen.getByText(/gst.*\$0\.00.*international/i)).toBeInTheDocument();
  });

  it('displays claimable GST at 100% business use', async () => {
    const user = userEvent.setup();

    mockedUseCreateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateExpense>);

    mockedUseUpdateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateExpense>);

    render(<ExpenseForm providers={mockProviders} categories={mockCategories} />);

    const amountInput = screen.getByLabelText('Amount (AUD)');
    const providerSelect = screen.getByLabelText('Provider');

    // Select domestic provider
    await user.selectOptions(providerSelect, '550e8400-e29b-41d4-a716-446655440000');

    // Enter amount: $110.00 = $10.00 GST
    await user.type(amountInput, '110');

    // Should display claimable GST: $10.00 (100% of $10.00) at default 100%
    expect(screen.getByText(/claimable gst.*\$10\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/100% of \$10\.00/i)).toBeInTheDocument();
  });

  it('has a slider for business use percentage', () => {
    mockedUseCreateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateExpense>);

    mockedUseUpdateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateExpense>);

    render(<ExpenseForm providers={mockProviders} categories={mockCategories} />);

    const bizPercentSlider = screen.getByLabelText(/business use percentage/i);

    // Should be a range input
    expect(bizPercentSlider).toHaveAttribute('type', 'range');
    expect(bizPercentSlider).toHaveAttribute('min', '0');
    expect(bizPercentSlider).toHaveAttribute('max', '100');
    expect(bizPercentSlider).toHaveAttribute('step', '5');
  });

  it('does not show GST calculation without provider selection', () => {
    mockedUseCreateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateExpense>);

    mockedUseUpdateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateExpense>);

    render(<ExpenseForm providers={mockProviders} categories={mockCategories} />);

    // Should not display GST calculation before provider is selected
    expect(screen.queryByText(/calculated gst/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/claimable gst/i)).not.toBeInTheDocument();
  });

  it('slider displays current percentage value', () => {
    mockedUseCreateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateExpense>);

    mockedUseUpdateExpense.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateExpense>);

    render(<ExpenseForm providers={mockProviders} categories={mockCategories} />);

    // Should display default value of 100% - look for the prominent display
    const percentageDisplay = screen.getByText((content, element) => {
      return (
        element?.tagName === 'SPAN' &&
        element.className.includes('font-semibold') &&
        content === '100%'
      );
    });
    expect(percentageDisplay).toBeInTheDocument();
  });
});
