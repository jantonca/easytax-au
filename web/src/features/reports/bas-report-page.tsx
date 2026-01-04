import type { ReactElement } from 'react';
import { useState } from 'react';
import { getFYInfo } from '@/lib/fy';
import { QuarterSelector } from './components/quarter-selector';
import type { QuarterSelectorValue } from './components/quarter-selector';
import { BasSummary } from './components/bas-summary';
import { useBasReport } from './hooks/use-bas-report';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/lib/toast-context';

export function BasReportPage(): ReactElement {
  const fyInfo = getFYInfo(new Date());
  const [period, setPeriod] = useState<QuarterSelectorValue>({
    quarter: fyInfo.quarter,
    financialYear: fyInfo.financialYear,
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: bas, isLoading, error } = useBasReport(period);
  const { showToast } = useToast();

  function handleDownloadPdf(): void {
    setIsDownloading(true);

    const baseUrl =
      typeof import.meta.env.VITE_API_URL === 'string'
        ? import.meta.env.VITE_API_URL
        : 'http://localhost:3000';
    const url = `${baseUrl}/reports/bas/${period.quarter}/${period.financialYear}/pdf`;

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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-12">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          <p className="text-sm text-slate-400">Loading BAS report...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 p-4">
          <p className="text-sm font-medium text-red-400">Failed to load BAS report</p>
          <p className="mt-1 text-sm text-red-300">
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      )}

      {/* BAS Summary */}
      {bas && !isLoading && <BasSummary bas={bas} />}

      {/* Empty State */}
      {!bas && !isLoading && !error && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-12 text-center">
          <p className="text-sm text-slate-400">No data available for this period</p>
        </div>
      )}
    </section>
  );
}
