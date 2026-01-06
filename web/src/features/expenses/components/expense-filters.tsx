import type { ReactElement } from 'react';
import type { CategoryDto, ProviderDto } from '@/lib/api-client';

export interface ExpenseFiltersValue {
  providerId: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
}

interface ExpenseFiltersProps {
  providers: ProviderDto[];
  categories: CategoryDto[];
  value: ExpenseFiltersValue;
  onChange: (value: ExpenseFiltersValue) => void;
}

export function ExpenseFilters({
  providers,
  categories,
  value,
  onChange,
}: ExpenseFiltersProps): ReactElement {
  function handleChange(partial: Partial<ExpenseFiltersValue>): void {
    onChange({ ...value, ...partial });
  }

  return (
    <section
      aria-label="Expense filters"
      className="flex flex-wrap gap-3 rounded-lg bg-slate-100 dark:bg-slate-950/40 p-3"
    >
      <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
        <label
          htmlFor="provider-filter"
          className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
        >
          Provider
        </label>
        <select
          id="provider-filter"
          className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
          value={value.providerId}
          onChange={(event) => handleChange({ providerId: event.target.value })}
        >
          <option value="all">All providers</option>
          {providers.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
        <label
          htmlFor="category-filter"
          className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
        >
          Category
        </label>
        <select
          id="category-filter"
          className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
          value={value.categoryId}
          onChange={(event) => handleChange({ categoryId: event.target.value })}
        >
          <option value="all">All categories</option>
          {categories.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
          Date range
        </span>
        <div className="flex items-center gap-2">
          <input
            id="date-from"
            type="date"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            value={value.dateFrom}
            onChange={(event) => handleChange({ dateFrom: event.target.value })}
          />
          <span className="text-[11px] text-slate-500">to</span>
          <input
            id="date-to"
            type="date"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            value={value.dateTo}
            onChange={(event) => handleChange({ dateTo: event.target.value })}
          />
        </div>
      </div>
    </section>
  );
}
