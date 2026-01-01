import type { ReactElement } from 'react';
import { Button } from '@/components/ui/button';

export function DashboardPage(): ReactElement {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">EasyTax-AU</p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Simpler BAS &amp; GST for Australian freelancers
        </h1>
        <p className="text-sm text-slate-400">
          Frontend scaffold  Phase F1.4  Layout &amp; navigation
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg">Open dashboard</Button>
        <Button variant="outline" size="lg" asChild>
          <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer">
            View API docs
          </a>
        </Button>
      </div>
    </div>
  );
}
