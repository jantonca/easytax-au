import type { ReactElement } from 'react';

interface SummaryStatsProps {
  data: {
    totalRows: number;
    successCount: number;
    failedCount: number;
    duplicateCount: number;
  };
}

export function SummaryStats({ data }: SummaryStatsProps): ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
        <p className="text-sm text-slate-600 dark:text-slate-400">Total Rows</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-200">
          {data.totalRows}
        </p>
      </div>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/40">
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Valid</p>
        <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
          {data.successCount}
        </p>
      </div>
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
        <p className="text-sm text-red-600 dark:text-red-400">Errors</p>
        <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{data.failedCount}</p>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
        <p className="text-sm text-amber-600 dark:text-amber-400">Duplicates</p>
        <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">
          {data.duplicateCount}
        </p>
      </div>
    </div>
  );
}
