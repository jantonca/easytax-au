import type { ReactElement } from 'react';

export function BasReportPage(): ReactElement {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">BAS reports</h1>
        <p className="text-sm text-slate-400">
          View quarterly BAS summaries and download PDFs. The full report UI will be implemented in
          Phase F3.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        <p>
          Placeholder for BAS reporting UI. This screen will show G1, 1A, 1B, and net GST payable
          per quarter with a PDF download button.
        </p>
      </div>
    </section>
  );
}
