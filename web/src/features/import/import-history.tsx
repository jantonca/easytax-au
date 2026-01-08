import type { ReactElement } from 'react';
import { useState } from 'react';
import { Loader2, AlertCircle, FileX } from 'lucide-react';
import { useImportJobs } from './hooks/use-import-jobs';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100);
}

function formatSource(source: string): string {
  const sourceMap: Record<string, string> = {
    commbank: 'CommBank',
    amex: 'Amex',
    manual: 'Manual',
    nab: 'NAB',
    westpac: 'Westpac',
    anz: 'ANZ',
    custom: 'Custom',
  };
  return sourceMap[source] || source;
}

export function ImportHistory(): ReactElement {
  const { data: jobs, isLoading, isError, error } = useImportJobs();
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 25;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-emerald-500" />
          <p className="text-slate-600 dark:text-slate-400">Loading import history...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-800 dark:bg-red-950/40">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          <div>
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
              Error Loading Import History
            </h2>
            <p className="mt-1 text-slate-700 dark:text-slate-300">
              {error?.message || 'An error occurred'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!jobs || jobs.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900/40">
        <FileX className="mx-auto mb-4 h-16 w-16 text-slate-400 dark:text-slate-600" />
        <h2 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-300">
          No Import History
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          You haven't imported any CSV files yet. Start importing to see your history here.
        </p>
      </div>
    );
  }

  // Sort jobs by date descending (newest first)
  const sortedJobs = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Pagination calculations
  const totalPages = Math.ceil(sortedJobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedJobs = sortedJobs.slice(startIndex, endIndex);
  const showPagination = sortedJobs.length > ITEMS_PER_PAGE;

  function handlePreviousPage(): void {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }

  function handleNextPage(): void {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium text-slate-700 dark:text-slate-300">
                Source
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Total
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Success
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Failed
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                Amount
              </th>
              <th className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                GST
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {paginatedJobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30">
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {formatDate(job.createdAt)}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {formatSource(job.source)}
                </td>
                <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300">
                  {job.totalRows}
                </td>
                <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">
                  {job.successCount}
                </td>
                <td
                  className={`px-4 py-3 text-right ${job.failedCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}
                >
                  {job.failedCount}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                  {formatCurrency(job.totalAmountCents)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                  {formatCurrency(job.totalGstCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="text-[11px] text-slate-600 dark:text-slate-400">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedJobs.length)} of {sortedJobs.length}
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
    </div>
  );
}
