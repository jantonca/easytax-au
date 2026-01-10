import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useGitHubRelease } from './use-github-release';

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

describe('useGitHubRelease', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not fetch automatically (enabled: false)', () => {
    const { result } = renderHook(() => useGitHubRelease(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fetch release data successfully when manually refetched', async () => {
    const mockRelease = {
      tag_name: 'v0.0.2',
      name: 'Release 0.0.2',
      html_url: 'https://github.com/jantonca/easytax-au/releases/tag/v0.0.2',
      published_at: '2026-01-10T00:00:00Z',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRelease,
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const { result } = renderHook(() => useGitHubRelease(), {
      wrapper: createWrapper(),
    });

    // Manually trigger refetch
    result.current.refetch();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockRelease);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/jantonca/easytax-au/releases/latest',
    );
  });

  it('should handle 404 errors (no releases)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        message: 'Not Found',
      }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const { result } = renderHook(() => useGitHubRelease(), {
      wrapper: createWrapper(),
    });

    result.current.refetch();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should handle network errors gracefully', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useGitHubRelease(), {
      wrapper: createWrapper(),
    });

    result.current.refetch();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeDefined();
    expect((result.current.error as Error).message).toContain('Network error');
  });

  it('should return correct release structure', async () => {
    const mockRelease = {
      tag_name: 'v1.0.0',
      name: 'Version 1.0.0',
      html_url: 'https://github.com/jantonca/easytax-au/releases/tag/v1.0.0',
      published_at: '2026-01-10T12:00:00Z',
    };

    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRelease,
      headers: new Headers({ 'content-type': 'application/json' }),
    });

    const { result } = renderHook(() => useGitHubRelease(), {
      wrapper: createWrapper(),
    });

    result.current.refetch();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveProperty('tag_name');
    expect(result.current.data).toHaveProperty('name');
    expect(result.current.data).toHaveProperty('html_url');
    expect(result.current.data).toHaveProperty('published_at');
  });

  it('should not retry on failure', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useGitHubRelease(), {
      wrapper: createWrapper(),
    });

    result.current.refetch();

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should only be called once (no retries)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
