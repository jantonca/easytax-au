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
}: CardSkeletonProps): JSX.Element {
  return (
    <section
      aria-label={ariaLabel}
      className="flex flex-col gap-1 rounded-lg border border-slate-800 bg-slate-900/60 p-4"
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
