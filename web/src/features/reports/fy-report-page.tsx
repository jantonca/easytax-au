import type { ReactElement } from 'react';
import { useState } from 'react';
import { getFYInfo } from '@/lib/fy';
import { YearSelector } from './components/year-selector';
import { FYSummary } from './components/fy-summary';
import { CategoryBreakdown } from './components/category-breakdown';
import { BasLabelBreakdown } from './components/bas-label-breakdown';
import { useFYReport } from './hooks/use-fy-report';
import { downloadFYReportPdf } from '@/lib/api-client';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/toast-context';

export function FyReportPage(): ReactElement {
  const fyInfo = getFYInfo(new Date());
  const [financialYear, setFinancialYear] = useState<number>(fyInfo.financialYear);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: fyReport, isLoading, error } = useFYReport({ financialYear });
  const { showToast } = useToast();

  function handleDownloadPdf(): void {
    setIsDownloading(true);

    downloadFYReportPdf(financialYear)
      .then(() => {
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">FY Reports</h1>
          <p className="text-sm text-slate-400">
            View financial year summaries for tax return preparation and download PDF reports
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading || isLoading || !fyReport}
          className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-slate-800"
          aria-label="Download FY report as PDF"
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

      {/* Year Selector */}
      <YearSelector value={financialYear} onChange={setFinancialYear} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-12">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          <p className="text-sm text-slate-400">Loading FY report...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-4">
          <p className="text-sm font-medium text-red-400">Failed to load FY report</p>
          <p className="mt-1 text-sm text-red-300">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      )}

      {/* FY Summary and Breakdowns */}
      {fyReport && !isLoading && (
        <div className="flex flex-col gap-8">
          {/* Summary Cards */}
          <FYSummary fy={fyReport} />

          {/* Expense Breakdown by Category */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-200">
              Expense Breakdown by Category
            </h2>
            <CategoryBreakdown categories={fyReport.expenses.byCategory} />
          </section>

          {/* Expense Breakdown by BAS Label */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-200">
              Expense Breakdown by BAS Label
            </h2>
            <BasLabelBreakdown categories={fyReport.expenses.byCategory} />
          </section>
        </div>
      )}

      {/* Empty State */}
      {!fyReport && !isLoading && !error && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-sm font-medium text-slate-300">
            No data available for FY{financialYear}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Add expenses and incomes to generate a financial year report
          </p>
        </div>
      )}
    </section>
  );
}
