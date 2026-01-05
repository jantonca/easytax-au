import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { usePreviewIncomeCsvImport } from './use-income-csv-preview';

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

describe('usePreviewIncomeCsvImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully preview income CSV import', async () => {
    const mockResponse = {
      importJobId: '123e4567-e89b-12d3-a456-426614174000',
      totalRows: 10,
      successCount: 8,
      failedCount: 1,
      duplicateCount: 1,
      totalAmountCents: 550000,
      totalGstCents: 50000,
      processingTimeMs: 150,
      rows: [
        {
          rowNumber: 1,
          success: true,
          isDuplicate: false,
          clientName: 'Acme Corp',
          matchScore: 0.95,
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
          invoiceNumber: 'INV-001',
          isPaid: true,
        },
        {
          rowNumber: 2,
          success: false,
          error: 'Invalid date format',
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => usePreviewIncomeCsvImport(), {
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
    expect(fetchCall[0]).toBe('http://localhost:3000/import/incomes/preview');

    // Verify FormData was sent
    const requestInit = fetchCall[1] as RequestInit;
    expect(requestInit.method).toBe('POST');
    expect(requestInit.body).toBeInstanceOf(FormData);

    const formData = requestInit.body as FormData;
    expect(formData.get('file')).toBe(file);
    expect(formData.get('source')).toBe('custom');
    expect(formData.get('matchThreshold')).toBe('0.6');
    expect(formData.get('skipDuplicates')).toBe('true');
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Invalid CSV format - missing required columns';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        message: errorMessage,
        statusCode: 400,
      }),
    });

    const { result } = renderHook(() => usePreviewIncomeCsvImport(), {
      wrapper: createWrapper(),
    });

    const file = new File(['invalid'], 'incomes.csv', { type: 'text/csv' });

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
      processingTimeMs: 50,
      rows: [],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => usePreviewIncomeCsvImport(), {
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
  });

  it('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => usePreviewIncomeCsvImport(), {
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
                json: async () => ({ totalRows: 0, rows: [] }),
              }),
            100,
          );
        }),
    );

    const { result } = renderHook(() => usePreviewIncomeCsvImport(), {
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

  it('should handle client fuzzy matching response', async () => {
    const mockResponse = {
      importJobId: 'fuzzy-test-id',
      totalRows: 3,
      successCount: 3,
      failedCount: 0,
      duplicateCount: 0,
      totalAmountCents: 330000,
      totalGstCents: 30000,
      processingTimeMs: 120,
      rows: [
        {
          rowNumber: 1,
          success: true,
          clientName: 'ABC Pty Ltd',
          matchScore: 1.0, // Exact match
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
        },
        {
          rowNumber: 2,
          success: true,
          clientName: 'XYZ Corp',
          matchScore: 0.85, // Fuzzy match
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
        },
        {
          rowNumber: 3,
          success: true,
          clientName: 'New Client',
          matchScore: 0, // No match - will create new
          subtotalCents: 100000,
          gstCents: 10000,
          totalCents: 110000,
        },
      ],
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => usePreviewIncomeCsvImport(), {
      wrapper: createWrapper(),
    });

    const file = new File(['client data'], 'incomes.csv', { type: 'text/csv' });

    result.current.mutate({
      file,
      source: 'custom',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.data?.rows).toHaveLength(3);
    expect(result.current.data?.rows[0].matchScore).toBe(1.0);
    expect(result.current.data?.rows[1].matchScore).toBe(0.85);
    expect(result.current.data?.rows[2].matchScore).toBe(0);
  });
});
