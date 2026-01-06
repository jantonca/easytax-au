import type { ReactElement } from 'react';
import type { ClientDto } from '@/lib/api-client';

export interface IncomeFiltersValue {
  clientId: string;
  paidStatus: 'all' | 'paid' | 'unpaid';
  dateFrom: string;
  dateTo: string;
}

interface IncomeFiltersProps {
  clients: ClientDto[];
  value: IncomeFiltersValue;
  onChange: (value: IncomeFiltersValue) => void;
}

export function IncomeFilters({ clients, value, onChange }: IncomeFiltersProps): ReactElement {
  function handleChange(partial: Partial<IncomeFiltersValue>): void {
    onChange({ ...value, ...partial });
  }

  return (
    <section
      aria-label="Income filters"
      className="flex flex-wrap gap-3 rounded-lg bg-slate-100 dark:bg-slate-950/40 p-3"
    >
      <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
        <label
          htmlFor="client-filter"
          className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
        >
          Client
        </label>
        <select
          id="client-filter"
          className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
          value={value.clientId}
          onChange={(event) => handleChange({ clientId: event.target.value })}
        >
          <option value="all">All clients</option>
          {clients.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
        <label
          htmlFor="paid-filter"
          className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
        >
          Payment status
        </label>
        <select
          id="paid-filter"
          className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
          value={value.paidStatus}
          onChange={(event) =>
            handleChange({ paidStatus: event.target.value as 'all' | 'paid' | 'unpaid' })
          }
        >
          <option value="all">All invoices</option>
          <option value="paid">Paid only</option>
          <option value="unpaid">Unpaid only</option>
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
