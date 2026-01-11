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

  describe('Pause and Resume functionality', () => {
    it('pauses toast timer and calculates remaining duration correctly', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Pausable toast', duration: 5000 });
      });

      expect(result.current.toasts).toHaveLength(1);
      const toast = result.current.toasts[0];
      if (!toast) throw new Error('Expected toast');

      // Wait 2 seconds, then pause
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Toast should still be visible
      expect(result.current.toasts).toHaveLength(1);

      // Pause the toast
      act(() => {
        result.current.pauseToast(toast.id);
      });

      // Wait 5 more seconds while paused - toast should still be visible
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('resumes toast timer with remaining duration', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Pausable toast', duration: 5000 });
      });

      const toast = result.current.toasts[0];
      if (!toast) throw new Error('Expected toast');

      // Wait 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Pause the toast
      act(() => {
        result.current.pauseToast(toast.id);
      });

      // Wait 5 seconds while paused
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(1);

      // Resume the toast
      act(() => {
        result.current.resumeToast(toast.id);
      });

      // Wait 2.9 seconds (total elapsed: 2 + 2.9 = 4.9s) - should still be visible
      act(() => {
        vi.advanceTimersByTime(2900);
      });

      expect(result.current.toasts).toHaveLength(1);

      // Wait 0.1 more second (total: 5s) - should be dismissed
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('ignores pause if toast is already paused', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast', duration: 5000 });
      });

      const toast = result.current.toasts[0];
      if (!toast) throw new Error('Expected toast');

      // Pause twice - should not cause errors
      act(() => {
        result.current.pauseToast(toast.id);
        result.current.pauseToast(toast.id);
      });

      expect(result.current.toasts).toHaveLength(1);
    });

    it('ignores resume if toast is not paused', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast', duration: 5000 });
      });

      const toast = result.current.toasts[0];
      if (!toast) throw new Error('Expected toast');

      // Resume without pausing first - should not cause errors
      act(() => {
        result.current.resumeToast(toast.id);
      });

      // Should auto-dismiss normally after 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('handles multiple pause/resume cycles', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      act(() => {
        result.current.showToast({ title: 'Toast', duration: 10000 });
      });

      const toast = result.current.toasts[0];
      if (!toast) throw new Error('Expected toast');

      // Wait 2s, pause, wait 3s, resume
      act(() => {
        vi.advanceTimersByTime(2000);
        result.current.pauseToast(toast.id);
        vi.advanceTimersByTime(3000);
        result.current.resumeToast(toast.id);
      });

      // Wait 4s, pause, wait 2s, resume
      act(() => {
        vi.advanceTimersByTime(4000);
        result.current.pauseToast(toast.id);
        vi.advanceTimersByTime(2000);
        result.current.resumeToast(toast.id);
      });

      // Total elapsed: 2 + 4 = 6s, remaining: 4s
      // Wait 3.9s - should still be visible
      act(() => {
        vi.advanceTimersByTime(3900);
      });

      expect(result.current.toasts).toHaveLength(1);

      // Wait 0.1s more (total: 10s) - should be dismissed
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('Stacking limit (max 5 toasts)', () => {
    it('enforces max 5 toast limit', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      // Add 7 toasts
      act(() => {
        for (let i = 0; i < 7; i++) {
          result.current.showToast({ title: `Toast ${i}`, duration: undefined });
        }
      });

      // Should only have 5
      expect(result.current.toasts).toHaveLength(5);
    });

    it('dismisses oldest toast when limit exceeded (FIFO)', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      // Add 7 toasts
      act(() => {
        for (let i = 0; i < 7; i++) {
          result.current.showToast({ title: `Toast ${i}`, duration: undefined });
        }
      });

      // First two should be dismissed (FIFO)
      expect(result.current.toasts[0]?.title).toBe('Toast 2');
      expect(result.current.toasts[4]?.title).toBe('Toast 6');
    });

    it('maintains stacking limit with auto-dismiss', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      // Add 5 toasts with staggered durations
      act(() => {
        result.current.showToast({ title: 'Toast 0', duration: 2000 });
        result.current.showToast({ title: 'Toast 1', duration: 6000 });
        result.current.showToast({ title: 'Toast 2', duration: 6000 });
        result.current.showToast({ title: 'Toast 3', duration: 6000 });
        result.current.showToast({ title: 'Toast 4', duration: 6000 });
      });

      expect(result.current.toasts).toHaveLength(5);
      expect(result.current.toasts[0]?.title).toBe('Toast 0');

      // Wait for Toast 0 to auto-dismiss (2000ms)
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should now have 4 (Toast 0 auto-dismissed)
      expect(result.current.toasts).toHaveLength(4);
      expect(result.current.toasts[0]?.title).toBe('Toast 1');

      // Add one more toast (should not exceed 5 total)
      act(() => {
        result.current.showToast({ title: 'Toast 5', duration: 6000 });
      });

      expect(result.current.toasts).toHaveLength(5);
      expect(result.current.toasts[0]?.title).toBe('Toast 1');
      expect(result.current.toasts[4]?.title).toBe('Toast 5');
    });

    it('allows adding more toasts after some are dismissed', () => {
      const { result } = renderHook(() => useToast(), { wrapper });

      // Add 5 toasts (at limit)
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.showToast({ title: `Toast ${i}`, duration: undefined });
        }
      });

      expect(result.current.toasts).toHaveLength(5);

      // Add one more (should dismiss Toast 0)
      act(() => {
        result.current.showToast({ title: 'Toast 5', duration: undefined });
      });

      expect(result.current.toasts).toHaveLength(5);
      expect(result.current.toasts[0]?.title).toBe('Toast 1');
      expect(result.current.toasts[4]?.title).toBe('Toast 5');
    });
  });
});
