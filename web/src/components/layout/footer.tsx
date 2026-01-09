import type { ReactElement } from 'react';
import { useVersion } from '@/hooks/use-version';

export function Footer(): ReactElement {
  const { data: version, isLoading, isError } = useVersion();

  return (
    <footer
      role="contentinfo"
      className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-medium">EasyTax-AU</span>
          {!isLoading && !isError && version && (
            <span className="text-slate-500 dark:text-slate-500">v{version.version}</span>
          )}
        </div>
        <div className="text-slate-500 dark:text-slate-500">
          <span className="hidden sm:inline">Australian Tax Management</span>
          <span className="sm:hidden">AU Tax</span>
        </div>
      </div>
    </footer>
  );
}
