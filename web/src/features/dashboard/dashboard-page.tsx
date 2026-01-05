import type { ReactElement } from 'react';
import { GstSummaryCard } from '@/features/dashboard/components/gst-summary-card';
import { QuickActions } from '@/features/dashboard/components/quick-actions';
import { RecentExpenses } from '@/features/dashboard/components/recent-expenses';
import { useDashboardData } from '@/features/dashboard/hooks/use-dashboard-data';
import { CardSkeleton } from '@/components/skeletons/card-skeleton';

export function DashboardPage(): ReactElement {
  const {
    bas,
    basLoading,
    basError,
    recentExpenses,
    recentExpensesLoading,
    dueRecurring,
    dueRecurringLoading,
  } = useDashboardData();

  const showError = basError != null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 py-2">
      <div className="grid gap-3 md:grid-cols-4">
        {basLoading && !bas ? (
          <>
            <CardSkeleton showDescription ariaLabel="Loading G1" />
            <CardSkeleton showDescription ariaLabel="Loading 1A" />
            <CardSkeleton showDescription ariaLabel="Loading 1B" />
            <CardSkeleton showDescription ariaLabel="Loading Net GST" />
          </>
        ) : bas && !showError ? (
          <>
            <GstSummaryCard
              label="G1 – Total sales"
              valueCents={bas.g1TotalSalesCents}
              description="Current quarter total sales (inc GST)."
            />
            <GstSummaryCard
              label="1A – GST collected"
              valueCents={bas.label1aGstCollectedCents}
              description="GST collected on sales."
            />
            <GstSummaryCard
              label="1B – GST paid"
              valueCents={bas.label1bGstPaidCents}
              description="Claimable GST on purchases."
            />
            <GstSummaryCard
              label="Net GST position"
              valueCents={bas.netGstPayableCents}
              description="Positive = payable to ATO, negative = refund due."
              variant={bas.netGstPayableCents < 0 ? 'positive' : 'negative'}
            />
          </>
        ) : (
          <GstSummaryCard
            label="Current quarter BAS"
            valueCents={0}
            description="Unable to load BAS summary. Check API and try again."
            variant="negative"
          />
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
        <RecentExpenses expenses={recentExpenses} isLoading={recentExpensesLoading} />
        <div className="flex flex-col gap-3">
          <QuickActions />
          <section
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
            aria-label="Upcoming recurring expenses"
          >
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              Upcoming recurring expenses
            </p>
            {dueRecurringLoading ? (
              <p className="mt-2 text-xs text-slate-500">Loading upcoming recurring expenses…</p>
            ) : !dueRecurring || dueRecurring.length === 0 ? (
              <p className="mt-2 text-xs text-slate-500">No recurring expenses due soon.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs text-slate-300">
                {dueRecurring.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-50">{item.name}</span>
                      <span className="text-[10px] text-slate-500">
                        Next due: {item.nextDueDate}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
