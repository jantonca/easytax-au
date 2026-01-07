import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast-provider';
import { useToast } from '@/lib/toast-context';

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds and removes toasts', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => {
      result.current.showToast({ title: 'Hello' });
    });

    expect(result.current.toasts).toHaveLength(1);

    const firstToast = result.current.toasts[0];
    if (!firstToast) {
      throw new Error('Expected a toast to be present');
    }

    act(() => {
      result.current.dismissToast(firstToast.id);
    });

    expect(result.current.toasts).toHaveLength(0);
  });

  describe('Auto-dismiss functionality', () => {
    it('auto-dismisses success toast after 4 seconds (default)', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Success!', variant: 'success' });
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward 3.9 seconds - should still be visible
      act(() => {
        vi.advanceTimersByTime(3900);
      });
      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward to 4 seconds - should be dismissed
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('auto-dismisses default toast after 5 seconds', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Info message' });
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward 4.9 seconds - should still be visible
      act(() => {
        vi.advanceTimersByTime(4900);
      });
      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward to 5 seconds - should be dismissed
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('auto-dismisses error toast after 8 seconds', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Error occurred', variant: 'error' });
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward 7.9 seconds - should still be visible
      act(() => {
        vi.advanceTimersByTime(7900);
      });
      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward to 8 seconds - should be dismissed
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('respects custom duration override', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Custom duration', duration: 2000 });
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward 1.9 seconds - should still be visible
      act(() => {
        vi.advanceTimersByTime(1900);
      });
      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward to 2 seconds - should be dismissed
      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('does not auto-dismiss when duration is undefined', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Manual dismiss only', duration: undefined });
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward 10 seconds - should still be visible
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(result.current.toasts).toHaveLength(1);

      // Manual dismiss should still work
      const toast = result.current.toasts[0];
      if (!toast) throw new Error('Expected toast');

      act(() => {
        result.current.dismissToast(toast.id);
      });
      expect(result.current.toasts).toHaveLength(0);
    });

    it('does not auto-dismiss when duration is 0', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'No auto-dismiss', duration: 0 });
      });

      expect(result.current.toasts).toHaveLength(1);

      // Fast-forward 10 seconds - should still be visible
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(result.current.toasts).toHaveLength(1);
    });

    it('clears timer when toast is manually dismissed before auto-dismiss', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Will dismiss early', variant: 'success' });
      });

      expect(result.current.toasts).toHaveLength(1);

      const toast = result.current.toasts[0];
      if (!toast) throw new Error('Expected toast');

      // Manually dismiss after 2 seconds (before 4-second auto-dismiss)
      act(() => {
        vi.advanceTimersByTime(2000);
        result.current.dismissToast(toast.id);
      });

      expect(result.current.toasts).toHaveLength(0);

      // Fast-forward past original auto-dismiss time - should not cause issues
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('handles multiple toasts with different durations', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast 1', duration: 2000 });
        result.current.showToast({ title: 'Toast 2', duration: 5000 });
        result.current.showToast({ title: 'Toast 3', duration: undefined }); // No auto-dismiss
      });

      expect(result.current.toasts).toHaveLength(3);

      // After 2 seconds, first toast should be dismissed
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.toasts).toHaveLength(2);
      expect(result.current.toasts.find((t) => t.title === 'Toast 1')).toBeUndefined();

      // After 5 seconds total, second toast should be dismissed
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]?.title).toBe('Toast 3');

      // Third toast should remain (no auto-dismiss)
      act(() => {
        vi.advanceTimersByTime(10000);
      });
      expect(result.current.toasts).toHaveLength(1);
    });

    it('cleans up all timers on unmount', () => {
      const { result, unmount } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast 1', duration: 5000 });
        result.current.showToast({ title: 'Toast 2', duration: 5000 });
      });

      expect(result.current.toasts).toHaveLength(2);

      // Unmount before auto-dismiss
      unmount();

      // Fast-forward - should not cause errors
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // No errors expected
    });
  });
});
