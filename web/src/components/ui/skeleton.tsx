import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Skeleton component for loading states
 * Displays an animated placeholder while content is loading
 */
export function Skeleton({ className, ...props }: SkeletonProps): JSX.Element {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded bg-gray-200 dark:bg-gray-800', className)}
      {...props}
    />
  );
}
