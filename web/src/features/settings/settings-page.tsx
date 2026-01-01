import type { ReactElement } from 'react';

export function SettingsPage(): ReactElement {
  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Settings</h1>
        <p className="text-sm text-slate-400">
          Manage providers, categories, and clients. Detailed management screens will be implemented
          in Phase F2.
        </p>
      </header>
      <div className="rounded-lg border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
        <p>
          Placeholder for settings screens. Youll be able to configure providers, categories, and
          clients here.
        </p>
      </div>
    </section>
  );
}
