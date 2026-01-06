import type { ReactElement } from 'react';
import type { BasSummaryDto } from '@/lib/api-client';
import { GstSummaryCard } from '@/features/dashboard/components/gst-summary-card';
import { format } from 'date-fns';

interface BasSummaryProps {
  bas: BasSummaryDto;
}

export function BasSummary({ bas }: BasSummaryProps): ReactElement {
  const isRefund = bas.netGstPayableCents < 0;
  const periodStart = new Date(bas.periodStart);
  const periodEnd = new Date(bas.periodEnd);

  return (
    <div className="flex flex-col gap-4">
      {/* Period Display */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Period</p>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-200">
          {format(periodStart, 'd MMM yyyy')} - {format(periodEnd, 'd MMM yyyy')}
        </p>
      </div>

      {/* GST Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GstSummaryCard
          label="G1 - Total Sales"
          valueCents={bas.g1TotalSalesCents}
          description="Total income including GST for the period"
        />

        <GstSummaryCard
          label="1A - GST Collected"
          valueCents={bas.label1aGstCollectedCents}
          description="GST collected on sales"
          variant="default"
        />

        <GstSummaryCard
          label="1B - GST Paid"
          valueCents={bas.label1bGstPaidCents}
          description="Claimable GST credits on purchases"
          variant="default"
        />

        <GstSummaryCard
          label={isRefund ? 'Net GST Refund' : 'Net GST Payable'}
          valueCents={Math.abs(bas.netGstPayableCents)}
          description={isRefund ? 'Amount due to you' : 'Amount due to ATO'}
          variant={isRefund ? 'positive' : 'negative'}
        />
      </div>

      {/* Record Counts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Income Records</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-200">
            {bas.incomeCount}
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Expense Records</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-200">
            {bas.expenseCount}
          </p>
        </div>
      </div>
    </div>
  );
}
