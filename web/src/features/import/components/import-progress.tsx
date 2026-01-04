import type { ReactElement } from 'react';
import type { components } from '@shared/types';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

type CsvImportResponseDto = components['schemas']['CsvImportResponseDto'];

interface ImportProgressProps {
  isLoading: boolean;
  data?: CsvImportResponseDto;
  error: Error | null;
  onViewExpenses?: () => void;
  onImportMore?: () => void;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return `${seconds.toFixed(1)} seconds`;
}

export function ImportProgress({
  isLoading,
  data,
  error,
  onViewExpenses,
  onImportMore,
}: ImportProgressProps): ReactElement {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-slate-800 bg-slate-900/40 p-12">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-emerald-500" />
        <h2 className="mb-2 text-xl font-semibold text-slate-200">Importing</h2>
        <p className="text-slate-400">Please wait while we process your CSV file...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-lg border border-red-800 bg-red-950/40 p-8">
        <div className="mb-4 flex items-center gap-3">
          <XCircle className="h-8 w-8 text-red-400" />
          <h2 className="text-xl font-semibold text-red-400">Import Failed</h2>
        </div>
        <p className="text-slate-300">{error.message}</p>
      </div>
    );
  }

  // Success state
  if (!data) {
    return <div />;
  }

  const failedRows = data.rows.filter((row) => !row.success);

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-8">
        <div className="mb-4 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
          <h2 className="text-xl font-semibold text-emerald-400">Import Complete</h2>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div>
            <p className="text-sm text-slate-400">Successfully Imported</p>
            <p className="text-2xl font-semibold text-slate-200">{data.successCount}</p>
          </div>
          {data.failedCount > 0 && (
            <div>
              <p className="text-sm text-slate-400">Failed</p>
              <p className="text-2xl font-semibold text-red-400">{data.failedCount}</p>
            </div>
          )}
          {data.duplicateCount > 0 && (
            <div>
              <p className="text-sm text-slate-400">Duplicates Skipped</p>
              <p className="text-2xl font-semibold text-amber-400">{data.duplicateCount}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-slate-400">Total Amount</p>
            <p className="text-2xl font-semibold text-slate-200">
              {formatCurrency(data.totalAmountCents)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">Total GST</p>
            <p className="text-2xl font-semibold text-slate-200">
              {formatCurrency(data.totalGstCents)}
            </p>
          </div>
        </div>

        {/* Processing Time */}
        <div className="mt-4 text-sm text-slate-400">
          Processed in {formatTime(data.processingTimeMs)}
        </div>
      </div>

      {/* Failed Rows */}
      {failedRows.length > 0 && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-6">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <h3 className="font-semibold text-red-400">Failed Rows</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {failedRows.map((row) => (
              <li key={row.rowNumber} className="text-slate-300">
                <span className="font-medium text-slate-200">Row {row.rowNumber}:</span> {row.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      {(onViewExpenses || onImportMore) && (
        <div className="flex gap-4">
          {onViewExpenses && (
            <button
              type="button"
              onClick={onViewExpenses}
              className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              View Expenses
            </button>
          )}
          {onImportMore && (
            <button
              type="button"
              onClick={onImportMore}
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 font-medium text-slate-200 transition-colors hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Import More
            </button>
          )}
        </div>
      )}
    </div>
  );
}
