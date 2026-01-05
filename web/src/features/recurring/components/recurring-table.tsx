import { useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCents } from '@/lib/currency';
import type { RecurringExpenseResponseDto } from '@/lib/api-client';

type SortField = 'name' | 'nextDueDate' | 'schedule' | 'amount' | 'isActive';
type SortDirection = 'asc' | 'desc';

interface RecurringTableProps {
  recurringExpenses: RecurringExpenseResponseDto[];
  onEdit: (recurring: RecurringExpenseResponseDto) => void;
  onDelete: (recurring: RecurringExpenseResponseDto) => void;
}

export function RecurringTable({
  recurringExpenses,
  onEdit,
  onDelete,
}: RecurringTableProps): JSX.Element {
  const [sortField, setSortField] = useState<SortField>('nextDueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedExpenses = useMemo(() => {
    const sorted = [...recurringExpenses].sort((a, b) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'nextDueDate':
          aValue = a.nextDueDate;
          bValue = b.nextDueDate;
          break;
        case 'schedule':
          aValue = a.schedule;
          bValue = b.schedule;
          break;
        case 'amount':
          aValue = a.amountCents;
          bValue = b.amountCents;
          break;
        case 'isActive':
          aValue = a.isActive ? 1 : 0;
          bValue = b.isActive ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [recurringExpenses, sortField, sortDirection]);

  const getDueDateStatus = (nextDueDate: string): 'overdue' | 'due-soon' | 'future' => {
    const today = new Date();
    const dueDate = new Date(nextDueDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'due-soon';
    return 'future';
  };

  const getDueDateColor = (status: 'overdue' | 'due-soon' | 'future'): string => {
    switch (status) {
      case 'overdue':
        return 'text-red-400 font-semibold';
      case 'due-soon':
        return 'text-amber-400 font-semibold';
      case 'future':
        return 'text-slate-100';
    }
  };

  const formatSchedule = (schedule: string): string => {
    return schedule.charAt(0).toUpperCase() + schedule.slice(1);
  };

  const getSortIcon = (field: SortField): string => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  if (sortedExpenses.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
        <p>No recurring expenses yet.</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Recurring Expenses"
      className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
    >
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight text-slate-50">Recurring Expenses</h2>
        <p className="text-[11px] text-slate-500">
          Sorted by {sortField === 'nextDueDate' ? 'next due date' : sortField}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-xs text-slate-300">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              <th
                scope="col"
                className="py-2 pr-3"
                aria-sort={
                  sortField === 'name'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1 text-left hover:text-slate-300"
                >
                  <span>Name</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIcon('name')}
                  </span>
                </button>
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
                aria-sort={
                  sortField === 'amount'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort('amount')}
                  className="inline-flex w-full items-center justify-end gap-1 text-right hover:text-slate-300"
                >
                  <span>Amount</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIcon('amount')}
                  </span>
                </button>
              </th>
              <th
                scope="col"
                className="py-2 pr-3"
                aria-sort={
                  sortField === 'schedule'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort('schedule')}
                  className="inline-flex items-center gap-1 text-left hover:text-slate-300"
                >
                  <span>Schedule</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIcon('schedule')}
                  </span>
                </button>
              </th>
              <th
                scope="col"
                className="py-2 pr-3"
                aria-sort={
                  sortField === 'nextDueDate'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort('nextDueDate')}
                  className="inline-flex items-center gap-1 text-left hover:text-slate-300"
                >
                  <span>Next Due</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIcon('nextDueDate')}
                  </span>
                </button>
              </th>
              <th scope="col" className="py-2 pr-3">
                Last Generated
              </th>
              <th
                scope="col"
                className="py-2 pr-3"
                aria-sort={
                  sortField === 'isActive'
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort('isActive')}
                  className="inline-flex items-center gap-1 text-left hover:text-slate-300"
                >
                  <span>Status</span>
                  <span aria-hidden="true" className="text-[9px]">
                    {getSortIcon('isActive')}
                  </span>
                </button>
              </th>
              <th scope="col" className="py-2 pr-0 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedExpenses.map((recurring) => {
              const dueDateStatus = getDueDateStatus(recurring.nextDueDate);

              return (
                <tr key={recurring.id} className="border-b border-slate-800 hover:bg-slate-900/50">
                  <td className="py-2 pr-3 font-medium text-slate-50">{recurring.name}</td>
                  <td className="py-2 pr-3 text-slate-400">{recurring.providerName ?? '—'}</td>
                  <td className="py-2 pr-3 text-slate-400">{recurring.categoryName ?? '—'}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">
                    {formatCents(recurring.amountCents)}
                  </td>
                  <td className="py-2 pr-3">
                    {formatSchedule(recurring.schedule)} (day {recurring.dayOfMonth})
                  </td>
                  <td className={`py-2 pr-3 ${getDueDateColor(dueDateStatus)}`}>
                    {new Date(recurring.nextDueDate).toLocaleDateString()}
                    {dueDateStatus === 'overdue' && ' (overdue)'}
                    {dueDateStatus === 'due-soon' && ' (due soon)'}
                  </td>
                  <td className="py-2 pr-3 text-slate-400">
                    {recurring.lastGeneratedDate &&
                    (recurring.lastGeneratedDate as unknown as string)
                      ? new Date(
                          recurring.lastGeneratedDate as unknown as string,
                        ).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="py-2 pr-3">
                    {recurring.isActive ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                        Paused
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-0 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(recurring)}
                        className="text-blue-400 hover:text-blue-300"
                        aria-label={`Edit ${recurring.name}`}
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(recurring)}
                        className="text-red-400 hover:text-red-300"
                        aria-label={`Delete ${recurring.name}`}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
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
