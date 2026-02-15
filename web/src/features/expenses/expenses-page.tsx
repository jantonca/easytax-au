import type { ReactElement } from 'react';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import type { ExpenseResponseDto } from '@/lib/api-client';
import { ExpensesTable } from '@/features/expenses/components/expenses-table';
import {
  ExpenseFilters,
  type ExpenseFiltersValue,
} from '@/features/expenses/components/expense-filters';
import { ExpenseForm } from '@/features/expenses/components/expense-form';
import { useExpenses } from '@/features/expenses/hooks/use-expenses';
import { useDeleteExpense } from '@/features/expenses/hooks/use-expense-mutations';
import { useCategories } from '@/hooks/use-categories';
import { useProviders } from '@/hooks/use-providers';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { formatCents } from '@/lib/currency';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';

export function ExpensesPage(): ReactElement {
  const { data: expenses, isLoading: expensesLoading, isError: expensesError } = useExpenses();
  const { data: providers = [] } = useProviders();
  const { data: categories = [] } = useCategories();

  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<ExpenseResponseDto | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseResponseDto | null>(null);

  const { mutate: deleteExpense, isPending: isDeleting } = useDeleteExpense();

  // Open create modal if ?new=true in URL (from keyboard shortcut)
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      // Intentionally setting state in effect to respond to URL changes
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Opening modal from URL param
      setIsCreateOpen(true);
      // Remove the query param to clean up the URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const [filters, setFilters] = useState<ExpenseFiltersValue>({
    providerId: 'all',
    categoryId: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const filteredExpenses = useMemo(() => {
    const items = expenses ?? [];

    return items.filter((expense) => {
      if (filters.providerId !== 'all' && expense.providerId !== filters.providerId) {
        return false;
      }

      if (filters.categoryId !== 'all' && expense.categoryId !== filters.categoryId) {
        return false;
      }

      const dateOnly = String(expense.date).slice(0, 10);

      if (filters.dateFrom && dateOnly < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && dateOnly > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [expenses, filters]);

  function handleDelete(): void {
    if (!expenseToDelete) {
      return;
    }

    deleteExpense(expenseToDelete.id, {
      onSuccess: () => {
        setExpenseToDelete(null);
      },
    });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Expenses
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Browse your expenses for the current and past BAS periods. Filters, forms, and bulk
            actions will be added across the F2.2 slices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Add expense
        </button>
      </header>

      {expensesLoading && <TableSkeleton columns={9} rows={8} ariaLabel="Loading expenses" />}

      {expensesError && !expensesLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200">
          We couldn&apos;t load your expenses right now. Please try again shortly.
        </div>
      )}

      {!expensesLoading && !expensesError && (
        <>
          {filteredExpenses.length === 0 ? (
            <EmptyState
              title="No expenses yet"
              description="Get started by adding your first business expense or import from CSV"
              icon={<Receipt size={48} />}
            />
          ) : (
            <>
              <ExpenseFilters
                providers={providers}
                categories={categories}
                value={filters}
                onChange={setFilters}
              />
              <ExpensesTable
                expenses={filteredExpenses}
                onEdit={(expense) => setExpenseToEdit(expense)}
                onDelete={(expense) => setExpenseToDelete(expense)}
              />
            </>
          )}

          {isCreateOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add expense"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Add expense
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <ExpenseForm
                  providers={providers}
                  categories={categories}
                  onSuccess={() => setIsCreateOpen(false)}
                />
              </div>
            </div>
          )}

          {expenseToEdit && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Edit expense"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Edit expense
                  </h2>
                  <button
                    type="button"
                    onClick={() => setExpenseToEdit(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <ExpenseForm
                  providers={providers}
                  categories={categories}
                  initialValues={expenseToEdit}
                  expenseId={expenseToEdit.id}
                  onSuccess={() => setExpenseToEdit(null)}
                />
              </div>
            </div>
          )}

          <ConfirmationDialog
            open={expenseToDelete !== null}
            onOpenChange={(open) => {
              if (!open) {
                setExpenseToDelete(null);
              }
            }}
            title="Delete expense"
            description={
              expenseToDelete ? (
                <>
                  Are you sure you want to delete{' '}
                  <strong>
                    {formatCents(expenseToDelete.amountCents)} -{' '}
                    {(() => {
                      const raw = (expenseToDelete as unknown as { description?: unknown })
                        .description;
                      return typeof raw === 'string' && raw.trim().length > 0 ? raw : 'Expense';
                    })()}{' '}
                    ({String(expenseToDelete.date).slice(0, 10)})
                  </strong>
                  ? This action cannot be undone.
                </>
              ) : (
                ''
              )
            }
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleDelete}
            isLoading={isDeleting}
            variant="danger"
          />
        </>
      )}
    </section>
  );
}
