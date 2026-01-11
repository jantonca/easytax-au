import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import type { ReactNode } from 'react';
import {
  useCreateIncome,
  useUpdateIncome,
  useDeleteIncome,
  useMarkPaid,
  useMarkUnpaid,
} from './use-income-mutations';
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

describe('useCreateIncome', () => {
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
      id: 'income-123',
      date: '2025-01-01',
      subtotalCents: 100000,
      gstCents: 10000,
      totalCents: 110000,
      clientId: 'client-123',
      isPaid: false,
    };

    (apiClient.apiClient.post as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateIncome(), { wrapper });

    result.current.mutate({
      data: {
        date: '2025-01-01',
        subtotalCents: 100000,
        gstCents: 10000,
        clientId: 'client-123',
      },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Income created successfully' });
  });

  it('shows generic error toast on 500 server error', async () => {
    (apiClient.apiClient.post as Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useCreateIncome(), { wrapper });

    result.current.mutate({
      data: {
        date: '2025-01-01',
        subtotalCents: 100000,
        gstCents: 10000,
        clientId: 'client-123',
      },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Failed to create income' });
  });

  it('shows specific error message on 400 validation error', async () => {
    const validationError = {
      message: 'subtotalCents must be a positive number',
      status: 400,
    };
    (apiClient.apiClient.post as Mock).mockRejectedValue(validationError);

    const { result } = renderHook(() => useCreateIncome(), { wrapper });

    result.current.mutate({
      data: {
        date: '2025-01-01',
        subtotalCents: -100,
        gstCents: 10000,
        clientId: 'client-123',
      },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({
      title: 'Failed to create income: subtotalCents must be a positive number',
    });
  });
});

describe('useUpdateIncome', () => {
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
      id: 'income-123',
      date: '2025-01-01',
      subtotalCents: 120000,
      gstCents: 12000,
      totalCents: 132000,
      clientId: 'client-123',
      isPaid: false,
    };

    (apiClient.apiClient.patch as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateIncome(), { wrapper });

    result.current.mutate({
      id: 'income-123',
      data: { subtotalCents: 120000 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Income updated successfully' });
  });

  it('shows generic error toast on 500 server error', async () => {
    (apiClient.apiClient.patch as Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useUpdateIncome(), { wrapper });

    result.current.mutate({
      id: 'income-123',
      data: { subtotalCents: 120000 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Failed to update income' });
  });
});

describe('useDeleteIncome', () => {
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

  it('shows success toast with correct message on successful deletion', async () => {
    (apiClient.apiClient.delete as Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteIncome(), { wrapper });

    result.current.mutate('income-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({
      title: 'Income deleted',
      variant: 'success',
    });
  });

  it('shows generic error toast on 500 server error', async () => {
    (apiClient.apiClient.delete as Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useDeleteIncome(), { wrapper });

    result.current.mutate('income-123');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Failed to delete income' });
  });
});

describe('useMarkPaid', () => {
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

  it('shows success toast when marking income as paid', async () => {
    const mockResponse = {
      id: 'income-123',
      isPaid: true,
      date: '2025-01-01',
      subtotalCents: 100000,
      gstCents: 10000,
      totalCents: 110000,
      clientId: 'client-123',
    };

    (apiClient.apiClient.patch as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMarkPaid(), { wrapper });

    result.current.mutate('income-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Income marked as paid' });
  });

  it('shows generic error toast on failure', async () => {
    (apiClient.apiClient.patch as Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useMarkPaid(), { wrapper });

    result.current.mutate('income-123');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Failed to mark income as paid' });
  });
});

describe('useMarkUnpaid', () => {
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

  it('shows success toast when marking income as unpaid', async () => {
    const mockResponse = {
      id: 'income-123',
      isPaid: false,
      date: '2025-01-01',
      subtotalCents: 100000,
      gstCents: 10000,
      totalCents: 110000,
      clientId: 'client-123',
    };

    (apiClient.apiClient.patch as Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useMarkUnpaid(), { wrapper });

    result.current.mutate('income-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Income marked as unpaid' });
  });

  it('shows generic error toast on failure', async () => {
    (apiClient.apiClient.patch as Mock).mockRejectedValue(new Error('Server error'));

    const { result } = renderHook(() => useMarkUnpaid(), { wrapper });

    result.current.mutate('income-123');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(mockToast.showToast).toHaveBeenCalledWith({ title: 'Failed to mark income as unpaid' });
  });
});
