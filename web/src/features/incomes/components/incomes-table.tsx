import type { ReactElement } from 'react';
import { useMemo, useState, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { IncomeResponseDto } from '@/lib/api-client';
import { formatCents, formatDate } from '@/lib/currency';
import { cn } from '@/lib/utils';

interface IncomesTableProps {
  incomes: IncomeResponseDto[];
  onEdit?: (income: IncomeResponseDto) => void;
  onDelete?: (income: IncomeResponseDto) => void;
  onTogglePaid?: (income: IncomeResponseDto) => void;
  onBulkDelete?: (ids: string[]) => void;
  onBulkExport?: (incomes: IncomeResponseDto[]) => void;
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
  onBulkDelete,
  onBulkExport,
}: IncomesTableProps): ReactElement {
  const [sortBy, setSortBy] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 25;

  const bulkOperationsEnabled = Boolean(onBulkDelete || onBulkExport);

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

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedIncomes = sorted.slice(startIndex, endIndex);
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

  const handleSelectAll = useCallback((): void => {
    const allIds = new Set(sorted.map((income) => income.id));
    setSelectedIds(allIds);
  }, [sorted]);

  const handleSelectNone = useCallback((): void => {
    setSelectedIds(new Set());
  }, []);

  const handleInvert = useCallback((): void => {
    const allIds = new Set(sorted.map((income) => income.id));
    const newSelection = new Set<string>();
    allIds.forEach((id) => {
      if (!selectedIds.has(id)) {
        newSelection.add(id);
      }
    });
    setSelectedIds(newSelection);
  }, [sorted, selectedIds]);

  const handleRowSelect = useCallback(
    (id: string, index: number, shiftKey: boolean): void => {
      if (shiftKey && lastClickedIndex !== null) {
        const start = Math.min(lastClickedIndex, index);
        const end = Math.max(lastClickedIndex, index);
        const rangeIds = new Set(selectedIds);
        for (let i = start; i <= end; i++) {
          if (paginatedIncomes[i]) {
            rangeIds.add(paginatedIncomes[i].id);
          }
        }
        setSelectedIds(rangeIds);
      } else {
        const newSelection = new Set(selectedIds);
        if (newSelection.has(id)) {
          newSelection.delete(id);
        } else {
          newSelection.add(id);
        }
        setSelectedIds(newSelection);
      }
      setLastClickedIndex(index);
    },
    [lastClickedIndex, paginatedIncomes, selectedIds],
  );

  const handleBulkDelete = useCallback((): void => {
    if (onBulkDelete && selectedIds.size > 0) {
      onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setLastClickedIndex(null);
    }
  }, [onBulkDelete, selectedIds]);

  const handleBulkExport = useCallback((): void => {
    if (onBulkExport && selectedIds.size > 0) {
      const selectedIncomes = incomes.filter((inc) => selectedIds.has(inc.id));
      onBulkExport(selectedIncomes);
    }
  }, [onBulkExport, selectedIds, incomes]);

  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 text-sm text-slate-600 dark:text-slate-400">
        <p>No incomes recorded yet.</p>
      </div>
    );
  }

  return (
    <section
      aria-label="Incomes"
      className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4"
    >
      {bulkOperationsEnabled && selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/40 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select All
              </button>
              <span className="text-[11px] text-slate-400">|</span>
              <button
                type="button"
                onClick={handleSelectNone}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Select None
              </button>
              <span className="text-[11px] text-slate-400">|</span>
              <button
                type="button"
                onClick={handleInvert}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
              >
                Invert
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {onBulkDelete && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0}
                className="inline-flex h-7 items-center rounded border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete Selected
              </button>
            )}
            {onBulkExport && (
              <button
                type="button"
                onClick={handleBulkExport}
                disabled={selectedIds.size === 0}
                className="inline-flex h-7 items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export Selected
              </button>
            )}
          </div>
        </div>
      )}
      {bulkOperationsEnabled && selectedIds.size === 0 && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Select All
            </button>
            <span className="text-[11px] text-slate-400">|</span>
            <button
              type="button"
              onClick={handleSelectNone}
              className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Select None
            </button>
            <span className="text-[11px] text-slate-400">|</span>
            <button
              type="button"
              onClick={handleInvert}
              className="text-[11px] text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Invert
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Sorted by {sortBy === 'date' ? 'date (newest first)' : sortBy}
          </p>
        </div>
      )}
      {!bulkOperationsEnabled && (
        <div className="mb-3 flex justify-end">
          <p className="text-[11px] text-slate-500">
            Sorted by {sortBy === 'date' ? 'date (newest first)' : sortBy}
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs text-slate-700 dark:text-slate-300">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-[0.18em] text-slate-500">
              {bulkOperationsEnabled && (
                <th scope="col" className="w-8 py-2 pr-2">
                  <span className="sr-only">Select</span>
                </th>
              )}
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
                  className="inline-flex items-center gap-1 text-left hover:text-slate-600 dark:hover:text-slate-300"
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
                  className="inline-flex w-full items-center justify-end gap-1 text-right hover:text-slate-600 dark:hover:text-slate-300"
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
                  className="inline-flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300"
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
            {paginatedIncomes.map((income, index) => {
              const dateLabel = formatDate(String(income.date));

              const description = (() => {
                const raw = (income as unknown as { description?: unknown }).description;
                return typeof raw === 'string' && raw.trim().length > 0 ? raw : '—';
              })();

              const invoiceNum = income.invoiceNum || '—';
              const clientName = income.client.name;
              const isSelected = selectedIds.has(income.id);

              return (
                <tr
                  key={income.id}
                  className="border-b border-slate-200 dark:border-slate-900 last:border-b-0"
                >
                  {bulkOperationsEnabled && (
                    <td className="w-8 py-2 pr-2 align-middle">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) =>
                          handleRowSelect(income.id, index, Boolean(e.nativeEvent.shiftKey))
                        }
                        aria-label={`Select income: ${description}`}
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 dark:border-slate-700 dark:bg-slate-900"
                      />
                    </td>
                  )}
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-700 dark:text-slate-200">
                    {dateLabel}
                  </td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-600 dark:text-slate-300">
                    {invoiceNum}
                  </td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-700 dark:text-slate-200">
                    {clientName}
                  </td>
                  <td className="py-2 pr-3 align-middle text-[11px] text-slate-900 dark:text-slate-100">
                    {description}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-700 dark:text-slate-200">
                    {formatCents(income.subtotalCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] text-slate-700 dark:text-slate-200">
                    {formatCents(income.gstCents)}
                  </td>
                  <td className="py-2 pr-3 align-middle text-right text-[11px] font-semibold text-slate-900 dark:text-slate-100">
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
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
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
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
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
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
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
                          className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400"
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
