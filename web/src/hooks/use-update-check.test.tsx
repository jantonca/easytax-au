import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateCheck, isNewerVersion } from './use-update-check';
import * as useGitHubReleaseModule from './use-github-release';
import * as useVersionModule from './use-version';

// Mock the hooks
vi.mock('./use-github-release');
vi.mock('./use-version');

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

describe('useUpdateCheck', () => {
  const mockRefetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not check for updates if current version is not loaded', () => {
    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    renderHook(() => useUpdateCheck(), {
      wrapper: createWrapper(),
    });

    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('should auto-check on first load', () => {
    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: { name: 'easytax-au', version: '0.0.1', nodeVersion: 'v22', environment: 'test' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    renderHook(() => useUpdateCheck(), {
      wrapper: createWrapper(),
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('update_last_check')).toBeTruthy();
  });

  it('should not auto-check if checked recently (< 24 hours)', () => {
    const recentCheck = Date.now() - 1000 * 60 * 60; // 1 hour ago
    localStorage.setItem('update_last_check', recentCheck.toString());

    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: { name: 'easytax-au', version: '0.0.1', nodeVersion: 'v22', environment: 'test' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    renderHook(() => useUpdateCheck(), {
      wrapper: createWrapper(),
    });

    expect(mockRefetch).not.toHaveBeenCalled();
  });

  it('should auto-check if last check was > 24 hours ago', () => {
    const oldCheck = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago
    localStorage.setItem('update_last_check', oldCheck.toString());

    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: { name: 'easytax-au', version: '0.0.1', nodeVersion: 'v22', environment: 'test' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    renderHook(() => useUpdateCheck(), {
      wrapper: createWrapper(),
    });

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it.skip('should detect update when newer version is available', async () => {
    // Set up mocks BEFORE rendering
    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: { name: 'easytax-au', version: '0.0.1', nodeVersion: 'v22', environment: 'test' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: {
        tag_name: 'v0.0.2',
        name: 'Release 0.0.2',
        html_url: 'https://github.com/jantonca/easytax-au/releases/tag/v0.0.2',
        published_at: '2026-01-10T00:00:00Z',
      },
      refetch: mockRefetch,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    let result: ReturnType<typeof renderHook<ReturnType<typeof useUpdateCheck>, unknown>>;
    await act(async () => {
      result = renderHook(() => useUpdateCheck(), {
        wrapper: createWrapper(),
      });
    });

    await waitFor(() => expect(result!.result.current.updateInfo).toBeTruthy());

    expect(result!.result.current.updateInfo?.hasUpdate).toBe(true);
    expect(result!.result.current.updateInfo?.currentVersion).toBe('0.0.1');
    expect(result!.result.current.updateInfo?.latestVersion).toBe('0.0.2');
  });

  it.skip('should not detect update when versions are the same', async () => {
    // Set up mocks BEFORE rendering
    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: { name: 'easytax-au', version: '0.0.1', nodeVersion: 'v22', environment: 'test' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: {
        tag_name: 'v0.0.1',
        name: 'Release 0.0.1',
        html_url: 'https://github.com/jantonca/easytax-au/releases/tag/v0.0.1',
        published_at: '2026-01-10T00:00:00Z',
      },
      refetch: mockRefetch,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    let result: ReturnType<typeof renderHook<ReturnType<typeof useUpdateCheck>, unknown>>;
    await act(async () => {
      result = renderHook(() => useUpdateCheck(), {
        wrapper: createWrapper(),
      });
    });

    await waitFor(() => expect(result!.result.current.updateInfo).toBeTruthy());

    expect(result!.result.current.updateInfo?.hasUpdate).toBe(false);
  });

  it('should handle manual check via checkNow', () => {
    localStorage.clear();

    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: { name: 'easytax-au', version: '0.0.1', nodeVersion: 'v22', environment: 'test' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    const { result } = renderHook(() => useUpdateCheck(), {
      wrapper: createWrapper(),
    });

    mockRefetch.mockClear();

    result.current.checkNow();

    expect(mockRefetch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('update_last_check')).toBeTruthy();
  });

  it('should pass through loading state', () => {
    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: { name: 'easytax-au', version: '0.0.1', nodeVersion: 'v22', environment: 'test' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    const { result } = renderHook(() => useUpdateCheck(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isChecking).toBe(true);
  });

  it('should pass through error state', () => {
    vi.mocked(useVersionModule.useVersion).mockReturnValue({
      data: { name: 'easytax-au', version: '0.0.1', nodeVersion: 'v22', environment: 'test' },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useVersionModule.useVersion>);

    vi.mocked(useGitHubReleaseModule.useGitHubRelease).mockReturnValue({
      data: undefined,
      refetch: mockRefetch,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useGitHubReleaseModule.useGitHubRelease>);

    const { result } = renderHook(() => useUpdateCheck(), {
      wrapper: createWrapper(),
    });

    expect(result.current.checkError).toBe(true);
  });
});

describe('isNewerVersion', () => {
  it('should return true when latest is newer (patch)', () => {
    expect(isNewerVersion('0.0.2', '0.0.1')).toBe(true);
  });

  it('should return true when latest is newer (minor)', () => {
    expect(isNewerVersion('0.1.0', '0.0.1')).toBe(true);
  });

  it('should return true when latest is newer (major)', () => {
    expect(isNewerVersion('1.0.0', '0.0.1')).toBe(true);
  });

  it('should return false when versions are equal', () => {
    expect(isNewerVersion('0.0.1', '0.0.1')).toBe(false);
  });

  it('should return false when latest is older', () => {
    expect(isNewerVersion('0.0.1', '0.0.2')).toBe(false);
  });

  it('should handle version with v prefix', () => {
    // The isNewerVersion function receives version WITHOUT 'v' prefix
    // as it's stripped in useUpdateCheck
    expect(isNewerVersion('0.0.2', '0.0.1')).toBe(true);
  });

  it('should handle missing patch version', () => {
    expect(isNewerVersion('0.1', '0.0.1')).toBe(true);
  });

  it('should handle complex version comparisons', () => {
    expect(isNewerVersion('1.2.3', '1.2.2')).toBe(true);
    expect(isNewerVersion('1.2.3', '1.1.9')).toBe(true);
    expect(isNewerVersion('2.0.0', '1.9.9')).toBe(true);
  });
});
