import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ExpenseResponseDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';

interface ExpensesTableProps {
  expenses: ExpenseResponseDto[];
  onEdit?: (expense: ExpenseResponseDto) => void;
  onDelete?: (expense: ExpenseResponseDto) => void;
}

type SortColumn = 'date' | 'amount' | 'provider';
type SortDirection = 'asc' | 'desc';

function getProviderName(expense: ExpenseResponseDto): string {
  const provider = (expense as unknown as { provider?: { name?: unknown } | null }).provider;
  const raw = provider?.name;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : '';
}

function getCategoryName(expense: ExpenseResponseDto): string {
  const category = (expense as unknown as { category?: { name?: unknown } | null }).category;
  const raw = category?.name;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw : '';
}

function getSortIndicator(
  column: SortColumn,
  sortBy: SortColumn,
  direction: SortDirection,
): string {
  if (column !== sortBy) {
    return '';
  }

  return direction === 'asc' ? '↑' : '↓';
}

function getAriaSort(
  column: SortColumn,
  sortBy: SortColumn,
  direction: SortDirection,
): 'ascending' | 'descending' | 'none' {
  if (column !== sortBy) {
    return 'none';
  }

  return direction === 'asc' ? 'ascending' : 'descending';
}

export function ExpensesTable({ expenses, onEdit, onDelete }: ExpensesTableProps): ReactElement {
  const [sortBy, setSortBy] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 25;

  const sorted = useMemo(() => {
    if (expenses.length === 0) {
      return [] as ExpenseResponseDto[];
    }

    const items = [...expenses];

    items.sort((a, b) => {
      let baseComparison = 0;

      switch (sortBy) {
        case 'date': {
          const aDate = String(a.date);
          const bDate = String(b.date);
          baseComparison = aDate.localeCompare(bDate);
          break;
        }
        case 'amount': {
          baseComparison = a.amountCents - b.amountCents;
          break;
        }
        case 'provider': {
          const aName = getProviderName(a).toLowerCase();
          const bName = getProviderName(b).toLowerCase();
          baseComparison = aName.localeCompare(bName);
          break;
        }
        default: {
          baseComparison = 0;
        }
      }

      if (baseComparison === 0) {
        // Stable tie-breaker on date to keep ordering deterministic
        const aDate = String(a.date);
        const bDate = String(b.date);
        baseComparison = aDate.localeCompare(bDate);
      }

      return sortDirection === 'asc' ? baseComparison : -baseComparison;
    });

    return items;
  }, [expenses, sortBy, sortDirection]);

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedExpenses = sorted.slice(startIndex, endIndex);
  const showPagination = sorted.length > ITEMS_PER_PAGE;

  function handleSort(column: SortColumn): void {
    setSortBy((current) => {
      if (current === column) {
        setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
        return current;
      }

      setSortDirection('asc');
      setCurrentPage(1); // Reset to page 1 when sorting changes
      return column;
    });
  }

  function handlePreviousPage(): void {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }

  function handleNextPage(): void {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-sm text-slate-600 dark:text-slate-400">
        <p>No expenses recorded yet.</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Expenses"
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4"
    >
      <div className="mb-3 flex justify-end">
        <p className="text-[11px] text-slate-500">
          Sorted by {sortBy === 'date' ? 'date (newest first)' : sortBy}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-190 border-collapse text-left text-xs text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <th
                scope="col"
                className="py-2 pr-3"
                aria-sort={getAriaSort('date', sortBy, sortDirection)}
              >
                <button
                  type="button"
                  onClick={() => handleSort('date')}
                  className="inline-flex items-center gap-1 text-left hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <span>Date</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIndicator('date', sortBy, sortDirection)}
                  </span>
                </button>
              </th>
              <th scope="col" className="py-2 pr-3">
                Description
              </th>
              <th scope="col" className="py-2 pr-3">
                Provider
              </th>
              <th scope="col" className="py-2 pr-3">
                Category
              </th>
              <th
                scope="col"
                className="py-2 pr-3 text-right"
                aria-sort={getAriaSort('amount', sortBy, sortDirection)}
              >
                <button
                  type="button"
                  onClick={() => handleSort('amount')}
                  className="inline-flex w-full items-center justify-end gap-1 text-right hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <span>Amount</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIndicator('amount', sortBy, sortDirection)}
                  </span>
                </button>
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                GST
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Biz %
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Period
              </th>
              <th scope="col" className="py-2 pr-0 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.map((expense) => {
              const dateLabel = String(expense.date).slice(0, 10);

              const description = (() => {
                const raw = (expense as unknown as { description?: unknown }).description;
                return typeof raw === 'string' && raw.trim().length > 0 ? raw : 'Expense';
              })();

              const providerName = getProviderName(expense) || '—';
              const categoryName = getCategoryName(expense) || '—';

              const periodLabel = `${expense.quarter} ${expense.fyLabel}`;

              return (
                <tr
                  key={expense.id}
                  className="border-b border-slate-200 dark:border-slate-900 last:border-b-0"
                >
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-700 dark:text-slate-200">
                    {dateLabel}
                  </td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-900 dark:text-slate-100">
                    {description}
                  </td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-700 dark:text-slate-200">
                    {providerName}
                  </td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-700 dark:text-slate-200">
                    {categoryName}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] font-semibold text-slate-900 dark:text-slate-100">
                    {formatCents(expense.amountCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-700 dark:text-slate-200">
                    {formatCents(expense.gstCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-700 dark:text-slate-200">
                    {expense.bizPercent}%
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-600 dark:text-slate-300">
                    {periodLabel}
                  </td>
                  <td className="py-2 pr-0 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(expense)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                          aria-label={`Edit expense: ${description}`}
                          title="Edit expense"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(expense)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400"
                          aria-label={`Delete expense: ${description}`}
                          title="Delete expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-3">
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            Showing {startIndex + 1}-{Math.min(endIndex, sorted.length)} of {sorted.length}
          </div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="inline-flex h-7 items-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-900"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="inline-flex h-7 items-center rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white dark:disabled:hover:bg-slate-900"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
