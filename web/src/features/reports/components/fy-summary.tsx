import type { ReactElement } from 'react';
import type { FYSummaryDto } from '@/lib/api-client';
import { GstSummaryCard } from '@/features/dashboard/components/gst-summary-card';
import { format } from 'date-fns';

interface FYSummaryProps {
  fy: FYSummaryDto;
}

export function FYSummary({ fy }: FYSummaryProps): ReactElement {
  const periodStart = new Date(fy.periodStart);
  const periodEnd = new Date(fy.periodEnd);
  const isProfit = fy.netProfitCents >= 0;
  const isRefund = fy.netGstPayableCents < 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Period Display */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
          Financial Year Period
        </p>
        <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-200">
          {format(periodStart, 'd MMM yyyy')} - {format(periodEnd, 'd MMM yyyy')}
        </p>
      </div>

      {/* Income Summary */}
      <section aria-label="Income Summary">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-300">
          Income Summary
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GstSummaryCard
            label="Total Income"
            valueCents={fy.income.totalIncomeCents}
            description={`${fy.income.count} invoice${fy.income.count === 1 ? '' : 's'} (inc GST)`}
          />

          <GstSummaryCard
            label="Paid Income"
            valueCents={fy.income.paidIncomeCents}
            description="Invoices marked as paid"
            variant="positive"
          />

          <GstSummaryCard
            label="Unpaid Income"
            valueCents={fy.income.unpaidIncomeCents}
            description="Outstanding invoices"
            variant={fy.income.unpaidIncomeCents > 0 ? 'negative' : 'default'}
          />

          <GstSummaryCard
            label="GST Collected"
            valueCents={fy.income.gstCollectedCents}
            description="GST on income (1A)"
          />
        </div>
      </section>

      {/* Expenses Summary */}
      <section aria-label="Expenses Summary">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-300">
          Expenses Summary
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <GstSummaryCard
            label="Total Expenses"
            valueCents={fy.expenses.totalExpensesCents}
            description={`${fy.expenses.count} expense${fy.expenses.count === 1 ? '' : 's'}`}
          />

          <GstSummaryCard
            label="GST Paid"
            valueCents={fy.expenses.gstPaidCents}
            description="Claimable GST credits (1B)"
          />

          <GstSummaryCard
            label="Categories"
            valueCents={0}
            description={`${fy.expenses.byCategory.length} categor${fy.expenses.byCategory.length === 1 ? 'y' : 'ies'} used`}
          />
        </div>
      </section>

      {/* Net Position */}
      <section aria-label="Net Position Summary">
        <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-300">
          Net Position
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <GstSummaryCard
            label={isProfit ? 'Net Profit' : 'Net Loss'}
            valueCents={Math.abs(fy.netProfitCents)}
            description={
              isProfit ? 'Total income minus total expenses' : 'Loss for the financial year'
            }
            variant={isProfit ? 'positive' : 'negative'}
          />

          <GstSummaryCard
            label={isRefund ? 'Net GST Refund' : 'Net GST Payable'}
            valueCents={Math.abs(fy.netGstPayableCents)}
            description={isRefund ? 'GST refund expected from ATO' : 'GST payable to ATO'}
            variant={isRefund ? 'positive' : 'negative'}
          />
        </div>
      </section>
    </div>
  );
}
