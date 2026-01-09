import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useVersion } from './use-version';

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

describe('useVersion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch version data successfully', async () => {
    const mockVersion = {
      name: 'easytax-au',
      version: '0.0.1',
      nodeVersion: 'v22.10.7',
      environment: 'development',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVersion,
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const { result } = renderHook(() => useVersion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockVersion);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors', async () => {
    const errorMessage = 'Failed to fetch version';

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        message: errorMessage,
        statusCode: 500,
      }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const { result } = renderHook(() => useVersion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should handle network errors', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useVersion(), {
      wrapper: createWrapper(),
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
                json: async () => ({
                  name: 'easytax-au',
                  version: '0.0.1',
                  nodeVersion: 'v22.10.7',
                  environment: 'test',
                }),
                headers: new Headers({ 'content-type': 'application/json' }),
              }),
            100,
          );
        }),
    );

    const { result } = renderHook(() => useVersion(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.isLoading).toBe(false);
  });

  it('should return correct version structure', async () => {
    const mockVersion = {
      name: 'easytax-au',
      version: '0.0.1',
      nodeVersion: 'v22.10.7',
      environment: 'production',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockVersion,
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const { result } = renderHook(() => useVersion(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveProperty('name');
    expect(result.current.data).toHaveProperty('version');
    expect(result.current.data).toHaveProperty('nodeVersion');
    expect(result.current.data).toHaveProperty('environment');
  });
});
