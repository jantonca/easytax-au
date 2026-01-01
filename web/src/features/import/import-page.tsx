import type { ReactElement } from 'react';

export function ImportPage(): ReactElement {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">CSV Import</h1>
        <p className="text-sm text-slate-400">
          Import expenses and incomes from CSV files. Dropzone, preview, validation, and import
          controls will be implemented in Phase F2.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        <p>
          Placeholder for the CSV import flow. Youll be able to preview rows, handle validation
          errors, and import selected records here.
        </p>
      </div>
    </section>
  );
}
