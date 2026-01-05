import type { ReactElement } from 'react';
import { Outlet } from 'react-router-dom';
import { ImportTabs } from './components/import-tabs';

export function UnifiedImportPage(): ReactElement {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">CSV Import</h1>
        <p className="text-sm text-slate-400">
          Import expenses and incomes from your bank statement and invoice CSV files
        </p>
      </header>

      <ImportTabs />

      <Outlet />
    </section>
  );
}
