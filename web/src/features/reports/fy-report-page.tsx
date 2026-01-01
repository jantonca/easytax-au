import type { ReactElement } from 'react';

export function FyReportPage(): ReactElement {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
          Financial year reports
        </h1>
        <p className="text-sm text-slate-400">
          Review annual income, expenses, and GST position. The full FY report UI will be
          implemented in Phase F3.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        <p>
          Placeholder for FY reporting UI. This screen will show annual summaries, breakdowns by
          category, and PDF export actions.
        </p>
      </div>
    </section>
  );
}
