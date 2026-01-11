import { useState } from 'react';
import type { JSX } from 'react';
import { Plus, Repeat } from 'lucide-react';
import { useRecurringExpenses } from './hooks/use-recurring';
import { useDeleteRecurring } from './hooks/use-recurring-mutations';
import { RecurringTable } from './components/recurring-table';
import { RecurringForm } from './components/recurring-form';
import { GenerateButton } from './components/generate-button';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/lib/toast-context';
import type { RecurringExpenseResponseDto } from '@/lib/api-client';
import { formatCents } from '@/lib/currency';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';

export function RecurringPage(): JSX.Element {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpenseResponseDto | null>(
    null,
  );
  const [deletingRecurring, setDeletingRecurring] = useState<RecurringExpenseResponseDto | null>(
    null,
  );

  const { data: recurringExpenses = [], isLoading, error } = useRecurringExpenses();
  const { mutate: deleteRecurring, isPending: isDeleting } = useDeleteRecurring();
  const { showToast } = useToast();

  const handleCreateSuccess = (): void => {
    setShowCreateModal(false);
    showToast({
      title: 'Success',
      description: 'Recurring expense created successfully',
      variant: 'success',
    });
  };

  const handleEditSuccess = (): void => {
    setEditingRecurring(null);
    showToast({
      title: 'Success',
      description: 'Recurring expense updated successfully',
      variant: 'success',
    });
  };

  const handleDelete = (): void => {
    if (!deletingRecurring) return;

    deleteRecurring(deletingRecurring.id, {
      onSuccess: () => {
        setDeletingRecurring(null);
      },
    });
  };

  const handleGenerateSuccess = (): void => {
    showToast({
      title: 'Success',
      description: 'Expenses generated successfully',
      variant: 'success',
    });
  };

  if (isLoading) {
    return (
      <section className="mx-auto flex max-w-5xl flex-col gap-3">
        <TableSkeleton columns={9} rows={5} ariaLabel="Loading recurring expenses" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="mx-auto flex max-w-5xl flex-col gap-3">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-200">
          Error loading recurring expenses: {String(error)}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Recurring Expenses
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Automate repetitive expense entries with recurring templates
          </p>
        </div>
        <div className="flex gap-2">
          <GenerateButton onSuccess={handleGenerateSuccess} />
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-8 items-center gap-2 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            Add Recurring Expense
          </button>
        </div>
      </header>

      {/* Table */}
      {recurringExpenses.length === 0 ? (
        <EmptyState
          title="No recurring expenses yet"
          description="Automate repetitive expenses like monthly subscriptions"
          icon={<Repeat size={48} />}
        />
      ) : (
        <RecurringTable
          recurringExpenses={recurringExpenses}
          onEdit={setEditingRecurring}
          onDelete={setDeletingRecurring}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create recurring expense"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Create Recurring Expense
              </h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <RecurringForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateModal(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecurring && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit recurring expense"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Edit Recurring Expense
              </h2>
              <button
                type="button"
                onClick={() => setEditingRecurring(null)}
                className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>
            <RecurringForm
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingRecurring(null)}
              initialValues={editingRecurring}
              recurringId={editingRecurring.id}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingRecurring && (
        <ConfirmationDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeletingRecurring(null);
          }}
          title="Delete Recurring Expense?"
          description={
            <>
              <p className="mb-2">Are you sure you want to delete this recurring expense?</p>
              <div className="rounded bg-slate-100 p-3 text-sm dark:bg-slate-800">
                <p className="font-medium text-slate-900 dark:text-slate-50">
                  {deletingRecurring.name}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  Amount: ${formatCents(deletingRecurring.amountCents)}
                </p>
                <p className="text-slate-700 dark:text-slate-300">
                  Schedule:{' '}
                  {deletingRecurring.schedule.charAt(0).toUpperCase() +
                    deletingRecurring.schedule.slice(1)}
                </p>
              </div>
              <p className="mt-3 text-amber-600 dark:text-amber-400">
                Note: This will only delete the template. Previously generated expenses will remain.
              </p>
            </>
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          variant="danger"
          onConfirm={handleDelete}
          isLoading={isDeleting}
        />
      )}
    </section>
  );
}
