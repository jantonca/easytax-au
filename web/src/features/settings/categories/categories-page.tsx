import type { ReactElement } from 'react';
import { useState } from 'react';
import type { CategoryDto } from '@/lib/api-client';
import { CategoriesTable } from '@/features/settings/categories/components/categories-table';
import { CategoryForm } from '@/features/settings/categories/components/category-form';
import { useDeleteCategory } from '@/features/settings/categories/hooks/use-category-mutations';
import { useCategories } from '@/hooks/use-categories';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useToast } from '@/lib/toast-context';
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
  const { showToast } = useToast();

  function handleDelete(): void {
    if (!categoryToDelete) {
      return;
    }

    deleteCategory(categoryToDelete.id, {
      onSuccess: () => {
        showToast({
          title: 'Category deleted',
          description: 'The category has been removed successfully.',
        });
        setCategoryToDelete(null);
      },
      onError: (error) => {
        console.error('Error deleting category:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete category. Please try again.',
        });
      },
    });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <SettingsTabs />
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Categories</h1>
          <p className="text-sm text-slate-400">
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
          <CategoriesTable
            categories={categories ?? []}
            onEdit={(category) => setCategoryToEdit(category)}
            onDelete={(category) => setCategoryToDelete(category)}
          />

          {isCreateOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add category"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-50">
                    Add category
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
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
              <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-50">
                    Edit category
                  </h2>
                  <button
                    type="button"
                    onClick={() => setCategoryToEdit(null)}
                    className="text-xs text-slate-400 hover:text-slate-200"
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
