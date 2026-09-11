import type { ReactElement } from 'react';
import { useState } from 'react';
import { getFYInfo } from '@/lib/fy';
import type { AccountingBasis } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';
import { QuarterSelector } from './components/quarter-selector';
import type { QuarterSelectorValue } from './components/quarter-selector';
import { BasSummary } from './components/bas-summary';
import { useBasReport } from './hooks/use-bas-report';
import { Download, Loader2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/lib/toast-context';

export function BasReportPage(): ReactElement {
  const fyInfo = getFYInfo(new Date());
  const [period, setPeriod] = useState<QuarterSelectorValue>({
    quarter: fyInfo.quarter,
    financialYear: fyInfo.financialYear,
  });
  const [basis, setBasis] = useState<AccountingBasis>('ACCRUAL');
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: bas, isLoading, error } = useBasReport({ ...period, basis });
  const { showToast } = useToast();

  const hasUnreconciled = basis === 'CASH' && (bas?.unreconciledPaidIncomeCount ?? 0) > 0;

  function handleDownloadPdf(): void {
    setIsDownloading(true);

    const baseUrl =
      typeof import.meta.env.VITE_API_URL === 'string'
        ? import.meta.env.VITE_API_URL
        : 'http://localhost:3000';
    const url = `${baseUrl}/reports/bas/${period.quarter}/${period.financialYear}/pdf?basis=${basis}`;

    fetch(url)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to download PDF');
        }
        return response.blob();
      })
      .then((blob) => {
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `bas-${period.quarter.toLowerCase()}-fy${period.financialYear}.pdf`;
        link.click();
        URL.revokeObjectURL(downloadUrl);

        showToast({
          title: 'PDF downloaded successfully',
          variant: 'success',
        });
      })
      .catch((err: unknown) => {
        showToast({
          title: 'Failed to download PDF',
          description: err instanceof Error ? err.message : undefined,
          variant: 'error',
        });
      })
      .finally(() => {
        setIsDownloading(false);
      });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">BAS Reports</h1>
          <p className="text-sm text-slate-400">
            View quarterly BAS summaries and download PDF reports for ATO submission
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading || isLoading || !bas}
          className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-800"
          aria-label="Download BAS report as PDF"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download PDF
            </>
          )}
        </button>
      </header>

      {/* Quarter Selector */}
      <QuarterSelector value={period} onChange={setPeriod} />

      {/* Accounting basis selector */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="bas-basis"
          className="text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          Accounting basis
        </label>
        <select
          id="bas-basis"
          value={basis}
          onChange={(e) => setBasis(e.target.value === 'CASH' ? 'CASH' : 'ACCRUAL')}
          className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="ACCRUAL">Accrual (invoice date)</option>
          <option value="CASH">Cash (payment date)</option>
        </select>
      </div>

      {/* Unreconciled paid income (cash basis) */}
      {hasUnreconciled && bas && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-950/40"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              {bas.unreconciledPaidIncomeCount} paid{' '}
              {bas.unreconciledPaidIncomeCount === 1 ? 'income has' : 'incomes have'} no recorded
              receipt date
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/90">
              {formatCents(bas.unreconciledPaidIncomeTotalCents ?? 0)} (incl. GST) is excluded from
              this cash-basis total because the payment period is unknown. Enter each receipt date
              in Incomes to reconcile them into the correct quarter.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white p-12 dark:border-slate-800 dark:bg-slate-900/40">
          <Loader2 className="h-5 w-5 animate-spin text-slate-600 dark:text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading BAS report...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
          <p className="text-sm font-medium text-red-800 dark:text-red-400">
            Failed to load BAS report
          </p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      )}

      {/* BAS Summary */}
      {bas && !isLoading && <BasSummary bas={bas} />}

      {/* Empty State */}
      {!bas && !isLoading && !error && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No data available for this period
          </p>
        </div>
      )}
    </section>
  );
}
