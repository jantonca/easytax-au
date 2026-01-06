import type { ReactElement } from 'react';
import { ArrowRightCircle, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function QuickActions(): ReactElement {
  return (
    <section className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">
        Quick actions
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" className="gap-1.5 text-xs">
          <Link to="/expenses">
            <PlusCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add expense</span>
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="gap-1.5 text-xs">
          <Link to="/incomes">
            <ArrowRightCircle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Add income</span>
          </Link>
        </Button>
      </div>
    </section>
  );
}
