import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategoryForm } from '@/features/settings/categories/components/category-form';
import {
  useCreateCategory,
  useUpdateCategory,
} from '@/features/settings/categories/hooks/use-category-mutations';

vi.mock('@/features/settings/categories/hooks/use-category-mutations');
vi.mock('@/lib/toast-context', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

const mockedUseCreateCategory = vi.mocked(useCreateCategory);
const mockedUseUpdateCategory = vi.mocked(useUpdateCategory);

describe('CategoryForm', () => {
  it('submits form and calls create mutation', async () => {
    const user = userEvent.setup();

    const mutate = vi.fn();

    mockedUseCreateCategory.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    render(<CategoryForm />);

    const nameInput = screen.getByLabelText('Category name');
    const basLabelSelect = screen.getByLabelText('BAS label');
    const deductibleCheckbox = screen.getByLabelText(/Tax deductible/i);

    await user.type(nameInput, 'Software');
    await user.selectOptions(basLabelSelect, '1B');

    expect((deductibleCheckbox as HTMLInputElement).checked).toBe(true);

    const submitButton = screen.getByRole('button', { name: 'Save category' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  it('validates required category name', async () => {
    const user = userEvent.setup();

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    render(<CategoryForm />);

    const submitButton = screen.getByRole('button', { name: 'Save category' });
    await user.click(submitButton);

    expect(await screen.findByText('Category name is required')).toBeInTheDocument();
  });

  it('defaults to BAS label 1B', () => {
    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    render(<CategoryForm />);

    const basLabelSelect = screen.getByLabelText('BAS label');

    expect(basLabelSelect.value).toBe('1B');
  });

  it('defaults isDeductible to true', () => {
    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    render(<CategoryForm />);

    const deductibleCheckbox = screen.getByLabelText(/Tax deductible/i);

    expect(deductibleCheckbox.checked).toBe(true);
  });

  it('allows selecting different BAS labels', async () => {
    const user = userEvent.setup();

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    render(<CategoryForm />);

    const basLabelSelect = screen.getByLabelText('BAS label');

    expect(basLabelSelect.value).toBe('1B');

    await user.selectOptions(basLabelSelect, 'G10');
    expect(basLabelSelect.value).toBe('G10');

    await user.selectOptions(basLabelSelect, 'G11');
    expect(basLabelSelect.value).toBe('G11');
  });

  it('toggles deductible checkbox', async () => {
    const user = userEvent.setup();

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    render(<CategoryForm />);

    const deductibleCheckbox = screen.getByLabelText(/Tax deductible/i);

    expect(deductibleCheckbox.checked).toBe(true);

    await user.click(deductibleCheckbox);

    expect(deductibleCheckbox.checked).toBe(false);
  });

  it('accepts optional description', async () => {
    const user = userEvent.setup();

    const mutate = vi.fn();

    mockedUseCreateCategory.mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    render(<CategoryForm />);

    const nameInput = screen.getByLabelText('Category name');
    const descriptionInput = screen.getByLabelText(/Description/i);

    await user.type(nameInput, 'Software');
    await user.type(descriptionInput, 'Software subscriptions and licenses');

    const submitButton = screen.getByRole('button', { name: 'Save category' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledTimes(1);
    });
  });

  it('validates description max length', async () => {
    const user = userEvent.setup();

    mockedUseCreateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateCategory>);

    mockedUseUpdateCategory.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateCategory>);

    render(<CategoryForm />);

    const nameInput = screen.getByLabelText('Category name');
    const descriptionInput = screen.getByLabelText(/Description/i);

    await user.type(nameInput, 'Software');
    await user.type(descriptionInput, 'a'.repeat(501)); // 501 characters

    const submitButton = screen.getByRole('button', { name: 'Save category' });
    await user.click(submitButton);

    expect(
      await screen.findByText('Description must be 500 characters or less'),
    ).toBeInTheDocument();
  });
});
