import type { ReactElement } from 'react';
import { useState } from 'react';
import type { CategoryDto } from '@/lib/api-client';

interface BulkCategoryChangeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (categoryId: string) => void;
  categories: CategoryDto[];
  selectedCount: number;
  isLoading?: boolean;
}

export function BulkCategoryChangeModal({
  open,
  onClose,
  onConfirm,
  categories,
  selectedCount,
  isLoading = false,
}: BulkCategoryChangeModalProps): ReactElement | null {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  function handleConfirm(): void {
    if (selectedCategoryId) {
      onConfirm(selectedCategoryId);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Change category for selected expenses"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Change Category
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Change the category for {selectedCount} selected expense{selectedCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="mb-4">
          <label
            htmlFor="bulk-category-select"
            className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            New Category
          </label>
          <select
            id="bulk-category-select"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            disabled={isLoading}
          >
            <option value="">Select a category...</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="inline-flex h-8 items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedCategoryId || isLoading}
            className="inline-flex h-8 items-center rounded bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Update Category'}
          </button>
        </div>
      </div>
    </div>
  );
}
