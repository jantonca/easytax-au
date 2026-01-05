import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useImportIncomeCsv } from './use-income-csv-import';

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

describe('useImportIncomeCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully import income CSV', async () => {
    const mockResponse = {
      importJobId: '123e4567-e89b-12d3-a456-426614174000',
      totalRows: 10,
      successCount: 8,
      failedCount: 1,
      duplicateCount: 1,
      totalAmountCents: 880000,
      totalGstCents: 80000,
      processingTimeMs: 250,
      rows: [],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useImportIncomeCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(
      ['date,client,invoiceNumber,subtotal,gst,total\n2025-01-01,Acme Corp,INV-001,1000,100,1100'],
      'incomes.csv',
      {
        type: 'text/csv',
      },
    );

    result.current.mutate({
      file,
      source: 'custom',
      matchThreshold: 0.6,
      skipDuplicates: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchCall[0]).toBe('http://localhost:3000/import/incomes');

    // Verify FormData was sent
    const requestInit = fetchCall[1] as RequestInit;
    expect(requestInit.method).toBe('POST');
    expect(requestInit.body).toBeInstanceOf(FormData);

    const formData = requestInit.body as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('source')).toBe('custom');
    expect(formData.get('matchThreshold')).toBe('0.6');
    expect(formData.get('skipDuplicates')).toBe('true');
    expect(formData.get('dryRun')).toBe('false'); // Actual import, not preview
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Client not found: Unknown Client';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: errorMessage,
        statusCode: 400,
      }),
    });

    const { result } = renderHook(() => useImportIncomeCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(['invalid client'], 'incomes.csv', { type: 'text/csv' });

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
      totalAmountCents: 110000,
      totalGstCents: 10000,
      processingTimeMs: 75,
      rows: [],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useImportIncomeCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(['data'], 'incomes.csv', { type: 'text/csv' });

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

    const { result } = renderHook(() => useImportIncomeCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(['data'], 'incomes.csv', { type: 'text/csv' });

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

    const { result } = renderHook(() => useImportIncomeCsv(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    const file = new File(['data'], 'incomes.csv', { type: 'text/csv' });
    result.current.mutate({
      file,
      source: 'manual',
    });

    // Wait for pending state to be set
    await waitFor(() => expect(result.current.isPending).toBe(true));
  });

  it('should handle successful import with statistics', async () => {
    const mockResponse = {
      importJobId: 'stats-test-id',
      totalRows: 15,
      successCount: 12,
      failedCount: 2,
      duplicateCount: 1,
      totalAmountCents: 1320000,
      totalGstCents: 120000,
      processingTimeMs: 350,
      rows: [
        {
          rowNumber: 1,
          success: true,
          clientName: 'Acme Corp',
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
        },
        {
          rowNumber: 14,
          success: false,
          error: 'Invalid total: subtotal + GST mismatch',
        },
        {
          rowNumber: 15,
          success: false,
          isDuplicate: true,
          clientName: 'XYZ Ltd',
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useImportIncomeCsv(), {
      wrapper: createWrapper(),
    });

    const file = new File(['income data'], 'incomes.csv', { type: 'text/csv' });

    result.current.mutate({
      file,
      source: 'custom',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.data?.totalRows).toBe(15);
    expect(result.current.data?.successCount).toBe(12);
    expect(result.current.data?.failedCount).toBe(2);
    expect(result.current.data?.duplicateCount).toBe(1);
  });
});
