import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { ProviderDto } from '@/lib/api-client';

interface ProvidersTableProps {
  providers: ProviderDto[];
  onEdit?: (provider: ProviderDto) => void;
  onDelete?: (provider: ProviderDto) => void;
}

type SortColumn = 'name' | 'isInternational';
type SortDirection = 'asc' | 'desc';

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

export function ProvidersTable({ providers, onEdit, onDelete }: ProvidersTableProps): ReactElement {
  const [sortBy, setSortBy] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sorted = useMemo(() => {
    if (providers.length === 0) {
      return [] as ProviderDto[];
    }

    const items = [...providers];

    items.sort((a, b) => {
      let baseComparison = 0;

      switch (sortBy) {
        case 'name': {
          baseComparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          break;
        }
        case 'isInternational': {
          baseComparison = Number(a.isInternational) - Number(b.isInternational);
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
  }, [providers, sortBy, sortDirection]);

  function handleSort(column: SortColumn): void {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  }

  if (providers.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No providers yet</p>
          <p className="text-xs text-slate-500">Add your first vendor to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse bg-white dark:bg-slate-950 text-xs">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
            <th className="p-2 text-left">
              <button
                onClick={() => {
                  handleSort('name');
                }}
                className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                aria-sort={getAriaSort('name', sortBy, sortDirection)}
              >
                Name {getSortIndicator('name', sortBy, sortDirection)}
              </button>
            </th>
            <th className="p-2 text-left">
              <button
                onClick={() => {
                  handleSort('isInternational');
                }}
                className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
                aria-sort={getAriaSort('isInternational', sortBy, sortDirection)}
              >
                Type {getSortIndicator('isInternational', sortBy, sortDirection)}
              </button>
            </th>
            <th className="p-2 text-left">
              <span className="font-medium text-slate-700 dark:text-slate-300">ABN/ARN</span>
            </th>
            <th className="p-2 text-right">
              <span className="font-medium text-slate-700 dark:text-slate-300">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((provider) => (
            <tr
              key={provider.id}
              className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <td className="p-2 text-slate-900 dark:text-slate-200">{provider.name}</td>
              <td className="p-2">
                {provider.isInternational ? (
                  <span
                    className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:text-blue-300"
                    aria-label="International provider (GST-free)"
                  >
                    International
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300"
                    aria-label="Domestic provider"
                  >
                    Domestic
                  </span>
                )}
              </td>
              <td className="p-2 text-slate-600 dark:text-slate-400">
                {provider.abnArn && provider.abnArn.length > 0 ? provider.abnArn : '—'}
              </td>
              <td className="p-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(provider);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                      aria-label={`Edit provider ${provider.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(provider);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-300"
                      aria-label={`Delete provider ${provider.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
