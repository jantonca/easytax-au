import type { ReactElement } from 'react';
import type { components } from '@shared/types';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

type CsvRowResultDto = components['schemas']['CsvRowResultDto'];

interface PreviewTableProps {
  rows: CsvRowResultDto[];
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

export function PreviewTable({ rows }: PreviewTableProps): ReactElement {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-12 text-center">
        <p className="text-slate-400">No rows to preview</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/40">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-800 bg-slate-900/60">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Row</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Status</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Provider</th>
              <th className="px-4 py-3 text-left font-medium text-slate-300">Category</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">Amount</th>
              <th className="px-4 py-3 text-right font-medium text-slate-300">GST</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row) => {
              const rowBgClass = !row.success
                ? 'bg-red-950/30'
                : row.isDuplicate
                  ? 'bg-amber-950/30'
                  : '';

              return (
                <tr key={row.rowNumber} className={rowBgClass}>
                  {/* Row Number */}
                  <td className="px-4 py-3 text-slate-400">{row.rowNumber}</td>

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

                  {/* Provider */}
                  <td className="px-4 py-3">
                    {row.providerName ? (
                      <div className="flex items-center">
                        <span className="text-slate-200">{row.providerName}</span>
                        {getConfidenceBadge(row.matchScore)}
                      </div>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    {row.categoryName ? (
                      <span className="text-slate-200">{row.categoryName}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.amountCents !== undefined ? (
                      <span className="text-slate-200">{formatCurrency(row.amountCents)}</span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>

                  {/* GST */}
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.gstCents !== undefined ? (
                      <span className="text-slate-200">{formatCurrency(row.gstCents)}</span>
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
        <div className="border-t border-slate-800 bg-slate-950/40 p-4">
          <h3 className="mb-2 text-sm font-medium text-red-400">Errors</h3>
          <ul className="space-y-1 text-sm">
            {rows
              .filter((row) => row.error)
              .map((row) => (
                <li key={row.rowNumber} className="text-slate-400">
                  <span className="font-medium text-slate-300">Row {row.rowNumber}:</span>{' '}
                  {row.error}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
