import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { ExpensesTable } from '@/features/expenses/components/expenses-table';
import {
  ExpenseFilters,
  type ExpenseFiltersValue,
} from '@/features/expenses/components/expense-filters';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { useCategories } from '@/hooks/use-categories';
import { useProviders } from '@/hooks/use-providers';

export function ExpensesPage(): ReactElement {
  const { data: expenses, isLoading: expensesLoading, isError: expensesError } = useExpenses();
  const { data: providers = [] } = useProviders();
  const { data: categories = [] } = useCategories();

  const [filters, setFilters] = useState<ExpenseFiltersValue>({
    providerId: 'all',
    categoryId: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const filteredExpenses = useMemo(() => {
    const items = expenses ?? [];

    return items.filter((expense) => {
      if (filters.providerId !== 'all' && expense.providerId !== filters.providerId) {
        return false;
      }

      if (filters.categoryId !== 'all' && expense.categoryId !== filters.categoryId) {
        return false;
      }

      const dateOnly = String(expense.date).slice(0, 10);

      if (filters.dateFrom && dateOnly < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && dateOnly > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [expenses, filters]);

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Expenses</h1>
        <p className="text-sm text-slate-400">
          Browse your expenses for the current and past BAS periods. Filters, forms, and bulk
          actions will be added in the next F2.2 slices.
        </p>
      </header>

      {expensesLoading && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
          Loading expenses…
        </div>
      )}

      {expensesError && !expensesLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200">
          We couldn&apos;t load your expenses right now. Please try again shortly.
        </div>
      )}

      {!expensesLoading && !expensesError && (
        <>
          <ExpenseFilters
            providers={providers}
            categories={categories}
            value={filters}
            onChange={setFilters}
          />
          <ExpensesTable expenses={filteredExpenses} />
        </>
      )}
    </section>
  );
}
