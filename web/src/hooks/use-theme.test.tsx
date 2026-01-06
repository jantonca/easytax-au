import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ThemeProvider, useTheme } from './use-theme';

describe('useTheme', () => {
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      key: vi.fn(),
      length: 0,
    };

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up document class
    document.documentElement.classList.remove('dark');
  });

  it('should provide default theme as "system"', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.theme).toBe('system');
  });

  it('should resolve system theme to light when system prefers light', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.effectiveTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should resolve system theme to dark when system prefers dark', () => {
    // Mock system preference for dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? true : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.effectiveTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should switch to dark theme and apply dark class', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should switch to light theme and remove dark class', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    // First set to dark
    act(() => {
      result.current.setTheme('dark');
    });

    // Then switch to light
    act(() => {
      result.current.setTheme('light');
    });

    expect(result.current.theme).toBe('light');
    expect(result.current.effectiveTheme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should persist theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      result.current.setTheme('dark');
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    expect(localStorageMock.theme).toBe('dark');
  });

  it('should load theme from localStorage on mount', () => {
    localStorageMock.theme = 'dark';

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.theme).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
  });

  it('should handle invalid theme in localStorage gracefully', () => {
    localStorageMock.theme = 'invalid-theme';

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    // Should fall back to system
    expect(result.current.theme).toBe('system');
  });

  it('should handle localStorage unavailable (private mode)', () => {
    // Mock localStorage to throw error
    global.localStorage = {
      getItem: vi.fn(() => {
        throw new Error('localStorage is not available');
      }),
      setItem: vi.fn(() => {
        throw new Error('localStorage is not available');
      }),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    // Should not crash and fall back to system
    expect(result.current.theme).toBe('system');

    // Should not crash when setting theme
    act(() => {
      result.current.setTheme('dark');
    });

    expect(result.current.theme).toBe('dark');
  });

  it('should cycle through themes: light → dark → system', () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    // Start with system (default)
    expect(result.current.theme).toBe('system');

    // Set to light
    act(() => {
      result.current.setTheme('light');
    });
    expect(result.current.theme).toBe('light');

    // Set to dark
    act(() => {
      result.current.setTheme('dark');
    });
    expect(result.current.theme).toBe('dark');

    // Back to system
    act(() => {
      result.current.setTheme('system');
    });
    expect(result.current.theme).toBe('system');
  });

  it('should update effectiveTheme when system preference changes and theme is system', async () => {
    let matchMediaListener: ((event: MediaQueryListEvent) => void) | null = null;

    // Mock matchMedia with event listener support
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)' ? false : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
          if (event === 'change') {
            matchMediaListener = listener;
          }
        }),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    // Initially light
    expect(result.current.effectiveTheme).toBe('light');

    // Simulate system preference change to dark
    if (matchMediaListener) {
      act(() => {
        matchMediaListener!({ matches: true } as MediaQueryListEvent);
      });

      await waitFor(() => {
        expect(result.current.effectiveTheme).toBe('dark');
      });
    }
  });

  it('should throw error when useTheme is used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');

    consoleError.mockRestore();
  });
});
