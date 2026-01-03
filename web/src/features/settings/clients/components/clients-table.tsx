import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ClientDto, IncomeResponseDto } from '@/lib/api-client';

interface ClientsTableProps {
  clients: ClientDto[];
  incomes?: IncomeResponseDto[];
  onEdit?: (client: ClientDto) => void;
  onDelete?: (client: ClientDto) => void;
}

type SortColumn = 'name' | 'isPsiEligible';
type SortDirection = 'asc' | 'desc';

function formatAbn(abn: string | null | undefined): string {
  if (!abn || abn.length === 0) {
    return '—';
  }

  // Format ABN with spaces: 12 345 678 901
  if (abn.length === 11) {
    return `${abn.slice(0, 2)} ${abn.slice(2, 5)} ${abn.slice(5, 8)} ${abn.slice(8, 11)}`;
  }

  return abn;
}

function getSortIndicator(
  column: SortColumn,
  sortBy: SortColumn,
  direction: SortDirection,
): string {
  if (column !== sortBy) {
    return '';
  }

  return direction === 'asc' ? '↑' : '↓';
}

function getAriaSort(
  column: SortColumn,
  sortBy: SortColumn,
  direction: SortDirection,
): 'ascending' | 'descending' | 'none' {
  if (column !== sortBy) {
    return 'none';
  }

  return direction === 'asc' ? 'ascending' : 'descending';
}

export function ClientsTable({
  clients,
  incomes = [],
  onEdit,
  onDelete,
}: ClientsTableProps): ReactElement {
  const [sortBy, setSortBy] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Count incomes per client
  const incomeCountsByClient = useMemo(() => {
    const counts = new Map<string, number>();

    incomes.forEach((income) => {
      const count = counts.get(income.clientId) ?? 0;
      counts.set(income.clientId, count + 1);
    });

    return counts;
  }, [incomes]);

  const sorted = useMemo(() => {
    if (clients.length === 0) {
      return [] as ClientDto[];
    }

    const items = [...clients];

    items.sort((a, b) => {
      let baseComparison = 0;

      switch (sortBy) {
        case 'name': {
          baseComparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          break;
        }
        case 'isPsiEligible': {
          baseComparison = Number(a.isPsiEligible) - Number(b.isPsiEligible);
          break;
        }
        default: {
          baseComparison = 0;
        }
      }

      if (baseComparison === 0) {
        // Stable tie-breaker on name to keep ordering deterministic
        baseComparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      }

      return sortDirection === 'asc' ? baseComparison : -baseComparison;
    });

    return items;
  }, [clients, sortBy, sortDirection]);

  function handleSort(column: SortColumn): void {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  }

  if (clients.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-md border border-slate-800 bg-slate-950 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-slate-300">No clients yet</p>
          <p className="text-xs text-slate-500">Add your first income client to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <table className="w-full border-collapse bg-slate-950 text-xs">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900">
            <th className="p-2 text-left">
              <button
                onClick={() => {
                  handleSort('name');
                }}
                className="flex items-center gap-1 font-medium text-slate-300 hover:text-slate-100"
                aria-sort={getAriaSort('name', sortBy, sortDirection)}
              >
                Name {getSortIndicator('name', sortBy, sortDirection)}
              </button>
            </th>
            <th className="p-2 text-left">
              <span className="font-medium text-slate-300">ABN</span>
            </th>
            <th className="p-2 text-left">
              <button
                onClick={() => {
                  handleSort('isPsiEligible');
                }}
                className="flex items-center gap-1 font-medium text-slate-300 hover:text-slate-100"
                aria-sort={getAriaSort('isPsiEligible', sortBy, sortDirection)}
              >
                PSI Eligible {getSortIndicator('isPsiEligible', sortBy, sortDirection)}
              </button>
            </th>
            <th className="p-2 text-left">
              <span className="font-medium text-slate-300">Related Incomes</span>
            </th>
            <th className="p-2 text-right">
              <span className="font-medium text-slate-300">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((client) => {
            const incomeCount = incomeCountsByClient.get(client.id) ?? 0;

            return (
              <tr key={client.id} className="border-b border-slate-800 hover:bg-slate-900">
                <td className="p-2 text-slate-200">{client.name}</td>
                <td className="p-2 text-slate-400">{formatAbn(client.abn)}</td>
                <td className="p-2">
                  {client.isPsiEligible ? (
                    <span
                      className="inline-flex items-center rounded-full bg-amber-900/50 px-2 py-0.5 text-[10px] font-medium text-amber-300"
                      aria-label="PSI rules may apply"
                    >
                      Yes
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400"
                      aria-label="PSI rules do not apply"
                    >
                      No
                    </span>
                  )}
                </td>
                <td className="p-2 text-slate-400">
                  {incomeCount > 0 ? (
                    <span className="text-slate-200">{incomeCount}</span>
                  ) : (
                    <span>0</span>
                  )}
                </td>
                <td className="p-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(client);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                        aria-label={`Edit client ${client.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(client);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-900/50 hover:text-red-300"
                        aria-label={`Delete client ${client.name}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
