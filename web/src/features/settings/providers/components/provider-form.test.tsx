import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CategoryDto } from '@/lib/api-client';
import { ProviderForm } from '@/features/settings/providers/components/provider-form';
import {
  useCreateProvider,
  useUpdateProvider,
} from '@/features/settings/providers/hooks/use-provider-mutations';

vi.mock('@/features/settings/providers/hooks/use-provider-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseCreateProvider = vi.mocked(useCreateProvider);
const mockedUseUpdateProvider = vi.mocked(useUpdateProvider);

describe('ProviderForm', () => {
  it('submits form and calls create mutation', async () => {
    const user = userEvent.setup();

    const categories: CategoryDto[] = [
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

    const mutate = vi.fn();

    mockedUseCreateProvider.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    render(<ProviderForm categories={categories} />);

    const nameInput = screen.getByLabelText('Provider name');
    const internationalCheckbox = screen.getByLabelText(/International provider/i);
    const categorySelect = screen.getByLabelText(/Default category/i);

    await user.type(nameInput, 'GitHub');
    await user.click(internationalCheckbox);
    await user.selectOptions(categorySelect, '660e8400-e29b-41d4-a716-446655440000');

    const submitButton = screen.getByRole('button', { name: 'Save provider' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  it('validates required provider name', async () => {
    const user = userEvent.setup();

    const categories: CategoryDto[] = [];

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    render(<ProviderForm categories={categories} />);

    const submitButton = screen.getByRole('button', { name: 'Save provider' });
    await user.click(submitButton);

    expect(await screen.findByText('Provider name is required')).toBeInTheDocument();
  });

  it('validates ABN format (11 digits)', async () => {
    const user = userEvent.setup();

    const categories: CategoryDto[] = [];

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    render(<ProviderForm categories={categories} />);

    const nameInput = screen.getByLabelText('Provider name');
    const abnInput = screen.getByLabelText(/ABN \/ ARN/i);

    await user.type(nameInput, 'Test Provider');
    await user.type(abnInput, '12345'); // Invalid: only 5 digits

    const submitButton = screen.getByRole('button', { name: 'Save provider' });
    await user.click(submitButton);

    expect(await screen.findByText('Must be 9 (ARN) or 11 (ABN) digits')).toBeInTheDocument();
  });

  it('accepts valid ARN format (9 digits)', async () => {
    const user = userEvent.setup();

    const categories: CategoryDto[] = [];
    const mutate = vi.fn();

    mockedUseCreateProvider.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    render(<ProviderForm categories={categories} />);

    const nameInput = screen.getByLabelText('Provider name');
    const abnInput = screen.getByLabelText(/ABN \/ ARN/i);

    await user.type(nameInput, 'Test Provider');
    await user.type(abnInput, '123456789'); // Valid ARN: 9 digits

    const submitButton = screen.getByRole('button', { name: 'Save provider' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  it('accepts valid ABN format (11 digits)', async () => {
    const user = userEvent.setup();

    const categories: CategoryDto[] = [];
    const mutate = vi.fn();

    mockedUseCreateProvider.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    render(<ProviderForm categories={categories} />);

    const nameInput = screen.getByLabelText('Provider name');
    const abnInput = screen.getByLabelText(/ABN \/ ARN/i);

    await user.type(nameInput, 'Test Provider');
    await user.type(abnInput, '51824753556'); // Valid ABN: 11 digits

    const submitButton = screen.getByRole('button', { name: 'Save provider' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  it('toggles international checkbox', async () => {
    const user = userEvent.setup();

    const categories: CategoryDto[] = [];

    mockedUseCreateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateProvider>);

    mockedUseUpdateProvider.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateProvider>);

    render(<ProviderForm categories={categories} />);

    const internationalCheckbox = screen.getByLabelText(
      /International provider/i,
    ) as HTMLInputElement;

    expect(internationalCheckbox.checked).toBe(false);

    await user.click(internationalCheckbox);

    expect(internationalCheckbox.checked).toBe(true);
  });
});
