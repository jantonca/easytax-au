import type { ReactElement } from 'react';
import { ExpensesTable } from '@/features/expenses/components/expenses-table';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';

export function ExpensesPage(): ReactElement {
  const { data, isLoading, isError } = useExpenses();

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Expenses</h1>
        <p className="text-sm text-slate-400">
          Browse your expenses for the current and past BAS periods. Filters, forms, and bulk
          actions will be added in the next F2.2 slices.
        </p>
      </header>

      {isLoading && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
          Loading expenses…
        </div>
      )}

      {isError && !isLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200">
          We couldn&apos;t load your expenses right now. Please try again shortly.
        </div>
      )}

      {!isLoading && !isError && <ExpensesTable expenses={data ?? []} />}
    </section>
  );
}
