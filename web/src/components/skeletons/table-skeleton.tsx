import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  /**
   * Number of columns to render
   */
  columns: number;

  /**
   * Number of rows to render (default: 5)
   */
  rows?: number;

  /**
   * Accessible label for the loading state
   */
  ariaLabel?: string;
}

/**
 * TableSkeleton component for loading table data
 * Mimics the structure of data tables in the app
 */
export function TableSkeleton({
  columns,
  rows = 5,
  ariaLabel = 'Loading data',
}: TableSkeletonProps): React.ReactElement {
  return (
    <section
      aria-label={ariaLabel}
      className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60"
    >
      <div className="mb-3">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <th key={colIndex} scope="col" className="py-2 pr-3">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-slate-200 last:border-b-0 dark:border-slate-900"
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="py-2 pr-3 align-middle">
                    <Skeleton className="h-4 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
