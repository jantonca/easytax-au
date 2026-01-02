import type { ReactElement } from 'react';
import type { ExpenseResponseDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';

interface ExpensesTableProps {
  expenses: ExpenseResponseDto[];
}

export function ExpensesTable({ expenses }: ExpensesTableProps): ReactElement {
  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        <p>No expenses recorded yet.</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Expenses"
      className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-slate-50">Expenses</h2>
        <p className="text-[11px] text-slate-500">Sorted by date (newest first)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <th scope="col" className="py-2 pr-3">
                Date
              </th>
              <th scope="col" className="py-2 pr-3">
                Description
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Amount
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                GST
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Biz %
              </th>
              <th scope="col" className="py-2 pr-0 text-right">
                Period
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((expense) => {
              const dateLabel = expense.date.slice(0, 10);

              const description = (() => {
                const raw = (expense as unknown as { description?: unknown }).description;
                return typeof raw === 'string' && raw.trim().length > 0 ? raw : 'Expense';
              })();

              const periodLabel = `${expense.quarter} ${expense.fyLabel}`;

              return (
                <tr key={expense.id} className="border-b border-slate-900 last:border-b-0">
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-200">{dateLabel}</td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-100">
                    {description}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] font-semibold text-slate-100">
                    {formatCents(expense.amountCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-200">
                    {formatCents(expense.gstCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-200">
                    {expense.bizPercent}%
                  </td>
                  <td className="py-2 pr-0 align-middle text-right text-[11px] text-slate-300">
                    {periodLabel}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
