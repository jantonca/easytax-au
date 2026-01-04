import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useImportCsv } from './use-csv-import';

// Mock fetch
global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useImportCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully import CSV', async () => {
    const mockResponse = {
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

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useImportCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(['date,description,amount\n2025-01-01,Test,100'], 'test.csv', {
      type: 'text/csv',
    });

    result.current.mutate({
      file,
      source: 'commbank',
      matchThreshold: 0.6,
      skipDuplicates: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe('http://localhost:3000/import/expenses');

    // Verify FormData was sent
    const requestInit = fetchCall[1] as RequestInit;
    expect(requestInit.method).toBe('POST');
    expect(requestInit.body).toBeInstanceOf(FormData);

    const formData = requestInit.body as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('source')).toBe('commbank');
    expect(formData.get('matchThreshold')).toBe('0.6');
    expect(formData.get('skipDuplicates')).toBe('true');
    expect(formData.get('dryRun')).toBe('false'); // Actual import, not preview
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Invalid CSV format';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: errorMessage,
        statusCode: 400,
      }),
    });

    const { result } = renderHook(() => useImportCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(['invalid'], 'test.csv', { type: 'text/csv' });

    result.current.mutate({
      file,
      source: 'manual',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toContain(errorMessage);
  });

  it('should use default values for optional parameters', async () => {
    const mockResponse = {
      importJobId: 'test-id',
      totalRows: 1,
      successCount: 1,
      failedCount: 0,
      duplicateCount: 0,
      totalAmountCents: 10000,
      totalGstCents: 909,
      processingTimeMs: 50,
      rows: [],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useImportCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(['data'], 'test.csv', { type: 'text/csv' });

    // Only provide file and source, let hook use defaults
    result.current.mutate({
      file,
      source: 'manual',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const formData = fetchCall[1].body as FormData;

    // Should use default values
    expect(formData.get('matchThreshold')).toBe('0.6');
    expect(formData.get('skipDuplicates')).toBe('true');
    expect(formData.get('dryRun')).toBe('false');
  });

  it('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useImportCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(['data'], 'test.csv', { type: 'text/csv' });

    result.current.mutate({
      file,
      source: 'manual',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect((result.current.error as Error).message).toContain('Network error');
  });

  it('should track loading state correctly', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 201,
                json: async () => ({ totalRows: 0, rows: [] }),
              }),
            100,
          );
        }),
    );

    const { result } = renderHook(() => useImportCsv(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    const file = new File(['data'], 'test.csv', { type: 'text/csv' });
    result.current.mutate({
      file,
      source: 'manual',
    });

    // Wait for pending state to be set
    await waitFor(() => expect(result.current.isPending).toBe(true));
  });
});
