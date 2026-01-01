import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/toast-provider';
import { useToast } from '@/lib/toast-context';

function wrapper({ children }: { children: ReactNode }): ReactElement {
  return <ToastProvider>{children}</ToastProvider>;
}

describe('ToastProvider', () => {
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
});
