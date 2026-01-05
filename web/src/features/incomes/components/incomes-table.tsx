import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { IncomeResponseDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface IncomesTableProps {
  incomes: IncomeResponseDto[];
  onEdit?: (income: IncomeResponseDto) => void;
  onDelete?: (income: IncomeResponseDto) => void;
  onTogglePaid?: (income: IncomeResponseDto) => void;
}

type SortColumn = 'date' | 'total' | 'client' | 'paid';
type SortDirection = 'asc' | 'desc';

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

export function IncomesTable({
  incomes,
  onEdit,
  onDelete,
  onTogglePaid,
}: IncomesTableProps): ReactElement {
  const [sortBy, setSortBy] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sorted = useMemo(() => {
    if (incomes.length === 0) {
      return [] as IncomeResponseDto[];
    }

    const items = [...incomes];

    items.sort((a, b) => {
      let baseComparison = 0;

      switch (sortBy) {
        case 'date': {
          const aDate = String(a.date);
          const bDate = String(b.date);
          baseComparison = aDate.localeCompare(bDate);
          break;
        }
        case 'total': {
          baseComparison = a.totalCents - b.totalCents;
          break;
        }
        case 'client': {
          const aName = a.client.name.toLowerCase();
          const bName = b.client.name.toLowerCase();
          baseComparison = aName.localeCompare(bName);
          break;
        }
        case 'paid': {
          const aPaid = a.isPaid ? 1 : 0;
          const bPaid = b.isPaid ? 1 : 0;
          baseComparison = aPaid - bPaid;
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
  }, [incomes, sortBy, sortDirection]);

  function handleSort(column: SortColumn): void {
    setSortBy((current) => {
      if (current === column) {
        setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
        return current;
      }

      setSortDirection('asc');
      return column;
    });
  }

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        <p>No incomes recorded yet.</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Incomes"
      className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-slate-50">Incomes</h2>
        <p className="text-[11px] text-slate-500">
          Sorted by {sortBy === 'date' ? 'date (newest first)' : sortBy}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-225 border-collapse text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <th
                scope="col"
                className="py-2 pr-3"
                aria-sort={getAriaSort('date', sortBy, sortDirection)}
              >
                <button
                  type="button"
                  onClick={() => handleSort('date')}
                  className="inline-flex items-center gap-1 text-left hover:text-slate-300"
                >
                  <span>Date</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIndicator('date', sortBy, sortDirection)}
                  </span>
                </button>
              </th>
              <th scope="col" className="py-2 pr-3">
                Invoice #
              </th>
              <th
                scope="col"
                className="py-2 pr-3"
                aria-sort={getAriaSort('client', sortBy, sortDirection)}
              >
                <button
                  type="button"
                  onClick={() => handleSort('client')}
                  className="inline-flex items-center gap-1 text-left hover:text-slate-300"
                >
                  <span>Client</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIndicator('client', sortBy, sortDirection)}
                  </span>
                </button>
              </th>
              <th scope="col" className="py-2 pr-3">
                Description
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                Subtotal
              </th>
              <th scope="col" className="py-2 pr-3 text-right">
                GST
              </th>
              <th
                scope="col"
                className="py-2 pr-3 text-right"
                aria-sort={getAriaSort('total', sortBy, sortDirection)}
              >
                <button
                  type="button"
                  onClick={() => handleSort('total')}
                  className="inline-flex w-full items-center justify-end gap-1 text-right hover:text-slate-300"
                >
                  <span>Total</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIndicator('total', sortBy, sortDirection)}
                  </span>
                </button>
              </th>
              <th
                scope="col"
                className="py-2 pr-3 text-center"
                aria-sort={getAriaSort('paid', sortBy, sortDirection)}
              >
                <button
                  type="button"
                  onClick={() => handleSort('paid')}
                  className="inline-flex items-center gap-1 hover:text-slate-300"
                >
                  <span>Paid</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIndicator('paid', sortBy, sortDirection)}
                  </span>
                </button>
              </th>
              <th scope="col" className="py-2 pr-0 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((income) => {
              const dateLabel = String(income.date).slice(0, 10);

              const description = (() => {
                const raw = (income as unknown as { description?: unknown }).description;
                return typeof raw === 'string' && raw.trim().length > 0 ? raw : '—';
              })();

              const invoiceNum = income.invoiceNum || '—';
              const clientName = income.client.name;

              return (
                <tr key={income.id} className="border-b border-slate-900 last:border-b-0">
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-200">{dateLabel}</td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-300">
                    {invoiceNum}
                  </td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-200">
                    {clientName}
                  </td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-100">
                    {description}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-200">
                    {formatCents(income.subtotalCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-200">
                    {formatCents(income.gstCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] font-semibold text-slate-100">
                    {formatCents(income.totalCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-center">
                    {onTogglePaid ? (
                      <button
                        type="button"
                        onClick={() => onTogglePaid(income)}
                        className={cn(
                          'inline-flex h-6 items-center rounded px-2 text-[10px] font-medium',
                          income.isPaid
                            ? 'bg-emerald-900/40 text-emerald-300'
                            : 'bg-amber-900/40 text-amber-300',
                        )}
                        title={income.isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                      >
                        {income.isPaid ? 'Paid' : 'Unpaid'}
                      </button>
                    ) : (
                      <span
                        className={cn(
                          'inline-flex h-6 items-center rounded px-2 text-[10px] font-medium',
                          income.isPaid
                            ? 'bg-emerald-900/40 text-emerald-300'
                            : 'bg-amber-900/40 text-amber-300',
                        )}
                      >
                        {income.isPaid ? 'Paid' : 'Unpaid'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-0 align-middle text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(income)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                          aria-label={`Edit income: ${description}`}
                          title="Edit income"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(income)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-red-900/40 hover:text-red-400"
                          aria-label={`Delete income: ${description}`}
                          title="Delete income"
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
    </section>
  );
}
