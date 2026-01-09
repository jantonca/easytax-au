import type { ReactElement } from 'react';
import { Info } from 'lucide-react';
import { SettingsTabs } from '@/features/settings/components/settings-tabs';
import { useVersion } from '@/hooks/use-version';

export function AboutPage(): ReactElement {
  const { data: version, isLoading, isError } = useVersion();

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <SettingsTabs />
      <header className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            About
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Application version and system information.
          </p>
        </div>
      </header>

      {isLoading && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-700 dark:border-t-slate-400" />
            Loading version information...
          </div>
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200 dark:border-red-900/60 dark:bg-red-950/60">
          We couldn&apos;t load version information right now. Please try again shortly.
        </div>
      )}

      {!isLoading && !isError && version && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <Info className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  EasyTax-AU
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Local-first tax management for Australian sole traders
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  Version
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {version.version}
                </dd>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  Environment
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {version.environment}
                </dd>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  Node.js
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {version.nodeVersion}
                </dd>
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-500">
                  Application
                </dt>
                <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {version.name}
                </dd>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <h3 className="mb-2 text-sm font-medium text-slate-900 dark:text-slate-50">
                About this application
              </h3>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <p>
                  EasyTax-AU helps Australian sole traders manage expenses, incomes, and GST
                  reporting for BAS (Business Activity Statement) compliance.
                </p>
                <p>
                  All financial data is stored locally in an encrypted PostgreSQL database. No data
                  is sent to external servers.
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-500">
                  Australian Financial Year: July 1 - June 30 | GST Rate: 10%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
