import type { ReactElement } from 'react';
import { useState } from 'react';
import { FolderOpen } from 'lucide-react';
import type { CategoryDto } from '@/lib/api-client';
import { CategoriesTable } from '@/features/settings/categories/components/categories-table';
import { CategoryForm } from '@/features/settings/categories/components/category-form';
import { useDeleteCategory } from '@/features/settings/categories/hooks/use-category-mutations';
import { useCategories } from '@/hooks/use-categories';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { SettingsTabs } from '@/features/settings/components/settings-tabs';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';

export function CategoriesPage(): ReactElement {
  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CategoryDto | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryDto | null>(null);

  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteCategory();

  function handleDelete(): void {
    if (!categoryToDelete) {
      return;
    }

    deleteCategory(categoryToDelete.id, {
      onSuccess: () => {
        setCategoryToDelete(null);
      },
    });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <SettingsTabs />
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Categories
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage expense categories with BAS labels for ATO reporting.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Add category
        </button>
      </header>

      {categoriesLoading && <TableSkeleton columns={5} rows={6} ariaLabel="Loading categories" />}

      {categoriesError && !categoriesLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200">
          We couldn&apos;t load your categories right now. Please try again shortly.
        </div>
      )}

      {!categoriesLoading && !categoriesError && (
        <>
          {!categories || categories.length === 0 ? (
            <EmptyState
              title="No categories yet"
              description="Organize expenses by category for better BAS reporting"
              icon={<FolderOpen size={48} />}
            />
          ) : (
            <CategoriesTable
              categories={categories}
              onEdit={(category) => setCategoryToEdit(category)}
              onDelete={(category) => setCategoryToDelete(category)}
            />
          )}

          {isCreateOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add category"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Add category
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <CategoryForm onSuccess={() => setIsCreateOpen(false)} />
              </div>
            </div>
          )}

          {categoryToEdit && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Edit category"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Edit category
                  </h2>
                  <button
                    type="button"
                    onClick={() => setCategoryToEdit(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <CategoryForm
                  initialValues={categoryToEdit}
                  categoryId={categoryToEdit.id}
                  onSuccess={() => setCategoryToEdit(null)}
                />
              </div>
            </div>
          )}

          <ConfirmationDialog
            open={categoryToDelete !== null}
            onOpenChange={(open) => {
              if (!open) {
                setCategoryToDelete(null);
              }
            }}
            title="Delete category"
            description={
              categoryToDelete ? (
                <>
                  Are you sure you want to delete <strong>{categoryToDelete.name}</strong>? This
                  action cannot be undone.
                </>
              ) : (
                ''
              )
            }
            confirmLabel="Delete"
            variant="danger"
            isLoading={isDeleting}
            onConfirm={handleDelete}
          />
        </>
      )}
    </section>
  );
}
