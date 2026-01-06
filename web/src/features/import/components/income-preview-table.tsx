import type { ReactElement } from 'react';
import type { components } from '@shared/types';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/currency';

type BaseCsvRowResultDto = components['schemas']['CsvRowResultDto'];

// Extend CsvRowResultDto to include income-specific fields
type CsvRowResultDto = BaseCsvRowResultDto & {
  clientName?: string;
  subtotalCents?: number;
  totalCents?: number;
  invoiceNum?: string;
  date?: string;
  description?: string;
  isPaid?: boolean;
};

interface IncomePreviewTableProps {
  rows: CsvRowResultDto[];
  selectable?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
}

function formatCurrency(cents?: number): string {
  if (cents === undefined || cents === null) {
    return '-';
  }
  return `$${(cents / 100).toFixed(2)}`;
}

function getConfidenceBadge(score?: number): ReactElement | null {
  if (score === undefined || score === null) {
    return null;
  }

  const percentage = Math.round(score * 100);

  if (score >= 0.8) {
    return (
      <span className="ml-2 rounded bg-emerald-500/20 px-1.5 py-0.5 text-xs text-emerald-400">
        {percentage}%
      </span>
    );
  }

  if (score >= 0.5) {
    return (
      <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
        {percentage}%
      </span>
    );
  }

  return (
    <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
      {percentage}%
    </span>
  );
}

export function IncomePreviewTable({
  rows,
  selectable = false,
  selectedRows = new Set(),
  onSelectionChange,
}: IncomePreviewTableProps): ReactElement {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-12 text-center">
        <p className="text-slate-600 dark:text-slate-400">No rows to preview</p>
      </div>
    );
  }

  const selectableRows = rows.filter((row) => row.success);
  const allSelectableSelected =
    selectableRows.length > 0 && selectableRows.every((row) => selectedRows.has(row.rowNumber));

  const handleToggleAll = (): void => {
    if (!onSelectionChange) return;

    if (allSelectableSelected) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all selectable rows
      onSelectionChange(new Set(selectableRows.map((row) => row.rowNumber)));
    }
  };

  const handleToggleRow = (rowNumber: number): void => {
    if (!onSelectionChange) return;

    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowNumber)) {
      newSelected.delete(rowNumber);
    } else {
      newSelected.add(rowNumber);
    }
    onSelectionChange(newSelected);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
      {/* Selection Count */}
      {selectable && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 px-4 py-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {selectedRows.size} of {rows.length} rows selected
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm table-fixed">
          <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={handleToggleAll}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              <th className="w-12 px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Row
              </th>
              <th className="w-20 px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Status
              </th>
              <th className="w-32 px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Client
              </th>
              <th className="w-24 px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Invoice #
              </th>
              <th className="w-24 px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Date
              </th>
              <th className="w-40 px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Description
              </th>
              <th className="w-24 px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Subtotal
              </th>
              <th className="w-24 px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                GST
              </th>
              <th className="w-24 px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((row) => {
              const rowBgClass = !row.success
                ? 'bg-red-950/30'
                : row.isDuplicate
                  ? 'bg-amber-950/30'
                  : '';

              const isRowSelected = selectedRows.has(row.rowNumber);
              const isRowDisabled = !row.success;

              return (
                <tr key={row.rowNumber} className={rowBgClass}>
                  {/* Checkbox */}
                  {selectable && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isRowSelected}
                        disabled={isRowDisabled}
                        onChange={() => handleToggleRow(row.rowNumber)}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={`Select row ${row.rowNumber}`}
                      />
                    </td>
                  )}

                  {/* Row Number */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.rowNumber}</td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {!row.success ? (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-400" />
                        <span className="text-red-400">Error</span>
                      </div>
                    ) : row.isDuplicate ? (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-amber-400">Duplicate</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-emerald-400">Success</span>
                      </div>
                    )}
                  </td>

                  {/* Client */}
                  <td className="px-4 py-3">
                    {row.clientName ? (
                      <div className="flex items-center">
                        <span className="text-slate-900 dark:text-slate-200">{row.clientName}</span>
                        {getConfidenceBadge(row.matchScore)}
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* Invoice Number */}
                  <td className="px-4 py-3">
                    {row.invoiceNum ? (
                      <span className="text-slate-900 dark:text-slate-200">{row.invoiceNum}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    {row.date ? (
                      <span className="text-slate-900 dark:text-slate-200">
                        {formatDate(row.date)}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 truncate" title={row.description}>
                    {row.description ? (
                      <span className="text-slate-900 dark:text-slate-200">{row.description}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* Subtotal */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.subtotalCents !== undefined ? (
                      <span className="text-slate-900 dark:text-slate-200">
                        {formatCurrency(row.subtotalCents)}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* GST */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.gstCents !== undefined ? (
                      <span className="text-slate-900 dark:text-slate-200">
                        {formatCurrency(row.gstCents)}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.totalCents !== undefined ? (
                      <span className="text-slate-900 dark:text-slate-200">
                        {formatCurrency(row.totalCents)}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Error Messages */}
      {rows.some((row) => row.error) && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-red-50 dark:bg-slate-950/40 p-4">
          <h3 className="mb-2 text-sm font-medium text-red-600 dark:text-red-400">Errors</h3>
          <ul className="space-y-1 text-sm">
            {rows
              .filter((row) => row.error)
              .map((row) => (
                <li key={row.rowNumber} className="text-slate-700 dark:text-slate-400">
                  <span className="font-medium text-slate-900 dark:text-slate-300">
                    Row {row.rowNumber}:
                  </span>{' '}
                  {row.error}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
