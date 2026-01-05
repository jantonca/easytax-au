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
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <p className="text-sm text-slate-400">Total Rows</p>
        <p className="text-2xl font-semibold text-slate-200">{data.totalRows}</p>
      </div>
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-4">
        <p className="text-sm text-emerald-400">Valid</p>
        <p className="text-2xl font-semibold text-emerald-400">{data.successCount}</p>
      </div>
      <div className="rounded-lg border border-red-800 bg-red-950/40 p-4">
        <p className="text-sm text-red-400">Errors</p>
        <p className="text-2xl font-semibold text-red-400">{data.failedCount}</p>
      </div>
      <div className="rounded-lg border border-amber-800 bg-amber-950/40 p-4">
        <p className="text-sm text-amber-400">Duplicates</p>
        <p className="text-2xl font-semibold text-amber-400">{data.duplicateCount}</p>
      </div>
    </div>
  );
}
