import { useMemo, useState } from 'react';
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

export function RecurringTable({ recurringExpenses, onEdit, onDelete }: RecurringTableProps) {
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
        return 'text-red-600 font-semibold';
      case 'due-soon':
        return 'text-amber-600 font-semibold';
      case 'future':
        return 'text-gray-700';
    }
  };

  const formatSchedule = (schedule: string): string => {
    return schedule.charAt(0).toUpperCase() + schedule.slice(1);
  };

  const getSortIcon = (field: SortField): string => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
              onClick={() => handleSort('name')}
              aria-sort={
                sortField === 'name'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              Name{getSortIcon('name')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Provider
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Category
            </th>
            <th
              scope="col"
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
              onClick={() => handleSort('amount')}
              aria-sort={
                sortField === 'amount'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              Amount{getSortIcon('amount')}
            </th>
            <th
              scope="col"
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
              onClick={() => handleSort('schedule')}
              aria-sort={
                sortField === 'schedule'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              Schedule{getSortIcon('schedule')}
            </th>
            <th
              scope="col"
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
              onClick={() => handleSort('nextDueDate')}
              aria-sort={
                sortField === 'nextDueDate'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              Next Due{getSortIcon('nextDueDate')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Last Generated
            </th>
            <th
              scope="col"
              className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
              onClick={() => handleSort('isActive')}
              aria-sort={
                sortField === 'isActive'
                  ? sortDirection === 'asc'
                    ? 'ascending'
                    : 'descending'
                  : 'none'
              }
            >
              Status{getSortIcon('isActive')}
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {sortedExpenses.map((recurring) => {
            const dueDateStatus = getDueDateStatus(recurring.nextDueDate);

            return (
              <tr key={recurring.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {recurring.name}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                  {recurring.providerName ?? 'Unknown'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                  {recurring.categoryName ?? 'Unknown'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                  ${formatCents(recurring.amountCents)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                  {formatSchedule(recurring.schedule)} (day {recurring.dayOfMonth})
                </td>
                <td
                  className={`whitespace-nowrap px-6 py-4 text-sm ${getDueDateColor(dueDateStatus)}`}
                >
                  {new Date(recurring.nextDueDate).toLocaleDateString()}
                  {dueDateStatus === 'overdue' && ' (overdue)'}
                  {dueDateStatus === 'due-soon' && ' (due soon)'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {recurring.lastGeneratedDate &&
                  typeof recurring.lastGeneratedDate === 'string' &&
                  recurring.lastGeneratedDate.length > 0
                    ? new Date(recurring.lastGeneratedDate).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  {recurring.isActive ? (
                    <span className="inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">
                      Paused
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(recurring)}
                      className="text-blue-600 hover:text-blue-800"
                      aria-label={`Edit ${recurring.name}`}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(recurring)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Delete ${recurring.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
