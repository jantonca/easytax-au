import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { ReactNode } from 'react';
import { useCreateExpense, useUpdateExpense, useDeleteExpense } from './use-expense-mutations';
import * as apiClient from '@/lib/api-client';
import * as toastContext from '@/lib/toast-context';

// Mock modules
vi.mock('@/lib/api-client', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api-client')>('@/lib/api-client');
  return {
    ...actual,
    apiClient: {
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock('@/lib/toast-context', () => ({
  useToast: vi.fn(),
}));

describe('useCreateExpense', () => {
  let mockToast: { showToast: Mock };
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockToast = {
      showToast: vi.fn(),
    };

    (toastContext.useToast as Mock).mockReturnValue(mockToast);
  });

  it('shows success toast with correct message on successful creation', async () => {
    const mockResponse = {
      id: 'expense-123',
      date: '2025-01-01',
      amountCents: 11000,
      gstCents: 1000,
      bizPercent: 100,
      providerId: 'provider-123',
      categoryId: 'category-456',
    };

    (apiClient.apiClient.post as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      data: {
        date: '2025-01-01',
        amountCents: 11000,
        gstCents: 1000,
        bizPercent: 100,
        providerId: 'provider-123',
        categoryId: 'category-456',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Expense created successfully' });
  });

  it('shows generic error toast on 500 server error', async () => {
    const serverError = new Error('Internal Server Error');
    (apiClient.apiClient.post as Mock).mockRejectedValue(serverError);

    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      data: {
        date: '2025-01-01',
        amountCents: 11000,
        providerId: 'provider-123',
        categoryId: 'category-456',
      },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Failed to create expense' });
  });

  it('shows specific error message on 400 validation error', async () => {
    const validationError = {
      message: 'amountCents must be a positive number',
      status: 400,
    };
    (apiClient.apiClient.post as Mock).mockRejectedValue(validationError);

    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      data: {
        date: '2025-01-01',
        amountCents: -100,
        providerId: 'provider-123',
        categoryId: 'category-456',
      },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({
      title: 'Failed to create expense: amountCents must be a positive number',
    });
  });
});

describe('useUpdateExpense', () => {
  let mockToast: { showToast: Mock };
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockToast = {
      showToast: vi.fn(),
    };

    (toastContext.useToast as Mock).mockReturnValue(mockToast);
  });

  it('shows success toast with correct message on successful update', async () => {
    const mockResponse = {
      id: 'expense-123',
      date: '2025-01-01',
      amountCents: 12000,
      gstCents: 1091,
      bizPercent: 100,
      providerId: 'provider-123',
      categoryId: 'category-456',
    };

    (apiClient.apiClient.patch as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({
      id: 'expense-123',
      data: { amountCents: 12000 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Expense updated successfully' });
  });

  it('shows generic error toast on 500 server error', async () => {
    (apiClient.apiClient.patch as Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({
      id: 'expense-123',
      data: { amountCents: 12000 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Failed to update expense' });
  });

  it('shows specific error message on 404 not found error', async () => {
    const notFoundError = {
      message: 'Expense with ID expense-999 not found',
      status: 404,
    };
    (apiClient.apiClient.patch as Mock).mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({
      id: 'expense-999',
      data: { amountCents: 12000 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({
      title: 'Failed to update expense: Expense with ID expense-999 not found',
    });
  });
});

describe('useDeleteExpense', () => {
  let mockToast: { showToast: Mock };
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockToast = {
      showToast: vi.fn(),
    };

    (toastContext.useToast as Mock).mockReturnValue(mockToast);
  });

  it('shows success toast when expense not in cache', async () => {
    (apiClient.apiClient.delete as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Expense deleted', variant: 'success' });
  });

  it('shows generic error toast on 500 server error', async () => {
    (apiClient.apiClient.delete as Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-123');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Failed to delete expense' });
  });

  it('shows specific error message on 404 not found error', async () => {
    const notFoundError = {
      message: 'Expense with ID expense-999 not found',
      status: 404,
    };
    (apiClient.apiClient.delete as Mock).mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-999');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({
      title: 'Failed to delete expense: Expense with ID expense-999 not found',
    });
  });
});
