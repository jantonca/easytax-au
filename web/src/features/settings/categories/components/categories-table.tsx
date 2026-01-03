import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { CategoryDto } from '@/lib/api-client';

interface CategoriesTableProps {
  categories: CategoryDto[];
  onEdit?: (category: CategoryDto) => void;
  onDelete?: (category: CategoryDto) => void;
}

type SortColumn = 'name' | 'basLabel';
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

export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
}: CategoriesTableProps): ReactElement {
  const [sortBy, setSortBy] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sorted = useMemo(() => {
    if (categories.length === 0) {
      return [] as CategoryDto[];
    }

    const items = [...categories];

    items.sort((a, b) => {
      let baseComparison = 0;

      switch (sortBy) {
        case 'name': {
          baseComparison = a.name.toLowerCase().localeCompare(b.name.toLowerCase());
          break;
        }
        case 'basLabel': {
          baseComparison = a.basLabel.localeCompare(b.basLabel);
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
  }, [categories, sortBy, sortDirection]);

  function handleSort(column: SortColumn): void {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  }

  if (categories.length === 0) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-md border border-slate-800 bg-slate-950 p-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-medium text-slate-300">No categories yet</p>
          <p className="text-xs text-slate-500">Add your first category to get started.</p>
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
              <button
                onClick={() => {
                  handleSort('basLabel');
                }}
                className="flex items-center gap-1 font-medium text-slate-300 hover:text-slate-100"
                aria-sort={getAriaSort('basLabel', sortBy, sortDirection)}
              >
                BAS Label {getSortIndicator('basLabel', sortBy, sortDirection)}
              </button>
            </th>
            <th className="p-2 text-left">
              <span className="font-medium text-slate-300">Deductible</span>
            </th>
            <th className="p-2 text-left">
              <span className="font-medium text-slate-300">Description</span>
            </th>
            <th className="p-2 text-right">
              <span className="font-medium text-slate-300">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((category) => (
            <tr key={category.id} className="border-b border-slate-800 hover:bg-slate-900">
              <td className="p-2 text-slate-200">{category.name}</td>
              <td className="p-2">
                <span
                  className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300"
                  title={`ATO BAS label ${category.basLabel}`}
                >
                  {category.basLabel}
                </span>
              </td>
              <td className="p-2">
                {category.isDeductible ? (
                  <span
                    className="inline-flex items-center rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300"
                    aria-label="Tax deductible"
                  >
                    Yes
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center rounded-full bg-red-900/50 px-2 py-0.5 text-[10px] font-medium text-red-300"
                    aria-label="Not tax deductible"
                  >
                    No
                  </span>
                )}
              </td>
              <td className="p-2 text-slate-400">
                {category.description && category.description.length > 0
                  ? category.description
                  : '—'}
              </td>
              <td className="p-2 text-right">
                <div className="flex items-center justify-end gap-1">
                  {onEdit && (
                    <button
                      onClick={() => {
                        onEdit(category);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                      aria-label={`Edit category ${category.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(category);
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-900/50 hover:text-red-300"
                      aria-label={`Delete category ${category.name}`}
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
