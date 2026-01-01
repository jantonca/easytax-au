import type { ReactElement } from 'react';

export function ExpensesPage(): ReactElement {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Expenses</h1>
        <p className="text-sm text-slate-400">
          Track and manage your business expenses. The full table, filters, and forms will be
          implemented in Phase F2.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        <p>
          Placeholder for the expenses table and form. This screen will show your expenses, filters,
          and actions once Phase F2 is implemented.
        </p>
      </div>
    </section>
  );
}
