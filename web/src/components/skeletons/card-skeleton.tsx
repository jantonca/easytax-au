import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface CardSkeletonProps {
  /**
   * Whether to show the description skeleton (default: false)
   */
  showDescription?: boolean;

  /**
   * Accessible label for the loading state
   */
  ariaLabel?: string;
}

/**
 * CardSkeleton component for loading card data
 * Mimics the structure of GstSummaryCard and similar card components
 */
export function CardSkeleton({
  showDescription = false,
  ariaLabel = 'Loading',
}: CardSkeletonProps): React.ReactElement {
  return (
    <section
      aria-label={ariaLabel}
      className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60"
    >
      {/* Label skeleton */}
      <Skeleton className="h-3 w-24" />

      {/* Value skeleton */}
      <Skeleton className="h-7 w-32" />

      {/* Optional description skeleton */}
      {showDescription ? <Skeleton className="h-3 w-full" /> : null}
    </section>
  );
}
