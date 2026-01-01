import type { ReactElement, ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { ToastProvider } from '@/components/ui/toast-provider';
import { ToastViewport } from '@/components/ui/toast-viewport';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps): ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          {children}
          <ToastViewport />
        </ToastProvider>
      </BrowserRouter>
      {import.meta.env.DEV ? <ReactQueryDevtools initialIsOpen={false} /> : null}
    </QueryClientProvider>
  );
}
