import type { ReactElement } from 'react';
import { cn } from '@/lib/utils';
import { formatCents } from '@/lib/currency';

interface GstSummaryCardProps {
  label: string;
  valueCents: number;
  description?: string;
  variant?: 'default' | 'positive' | 'negative';
}

export function GstSummaryCard({
  label,
  valueCents,
  description,
  variant = 'default',
}: GstSummaryCardProps): ReactElement {
  const formatted = formatCents(valueCents);

  const colorClasses =
    variant === 'positive'
      ? 'text-emerald-600 dark:text-emerald-400'
      : variant === 'negative'
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-slate-900 dark:text-slate-50';

  return (
    <section
      className="flex flex-col gap-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4"
      aria-label={label}
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
        {label}
      </p>
      <p className={cn('text-xl font-semibold', colorClasses)}>{formatted}</p>
      {description ? (
        <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
      ) : null}
    </section>
  );
}
