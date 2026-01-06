import type { ReactElement } from 'react';
import type { ClientDto } from '@/lib/api-client';

interface ClientSelectProps {
  clients: ClientDto[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function ClientSelect({ clients, value, onChange, error }: ClientSelectProps): ReactElement {
  return (
    <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
      <label
        htmlFor="income-client"
        className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
      >
        Client
      </label>
      <select
        id="income-client"
        className="h-8 rounded-md border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select a client…</option>
        {clients.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
