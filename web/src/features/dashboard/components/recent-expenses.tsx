import type { ReactElement } from 'react';
import type { ExpenseResponseDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';

interface RecentExpensesProps {
  expenses?: ExpenseResponseDto[];
  isLoading: boolean;
}

export function RecentExpenses({ expenses, isLoading }: RecentExpensesProps): ReactElement {
  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
          Recent expenses
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">Loading recent expenses…</p>
      </section>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
          Recent expenses
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">No expenses recorded yet.</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4"
      aria-label="Recent expenses"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
          Recent expenses
        </p>
        <p className="text-[10px] text-slate-500">Last {expenses.length} records</p>
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
        {expenses.map((expense) => {
          const dateLabel = expense.date.slice(0, 10);

          const description = (() => {
            const raw = (expense as unknown as { description?: unknown }).description;
            return typeof raw === 'string' && raw.trim().length > 0 ? raw : 'Expense';
          })();

          return (
            <li key={expense.id} className="flex items-center justify-between gap-2 py-1.5">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-900 dark:text-slate-50">
                  {description}
                </span>
                <span className="text-[10px] text-slate-500">{dateLabel}</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                {formatCents(expense.amountCents)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
