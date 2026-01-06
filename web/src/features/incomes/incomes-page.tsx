import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { DollarSign } from 'lucide-react';
import type { IncomeResponseDto } from '@/lib/api-client';
import { IncomesTable } from '@/features/incomes/components/incomes-table';
import {
  IncomeFilters,
  type IncomeFiltersValue,
} from '@/features/incomes/components/income-filters';
import { IncomeForm } from '@/features/incomes/components/income-form';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';
import {
  useDeleteIncome,
  useMarkPaid,
  useMarkUnpaid,
} from '@/features/incomes/hooks/use-income-mutations';
import { useClients } from '@/hooks/use-clients';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/lib/toast-context';
import { formatCents } from '@/lib/currency';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';

export function IncomesPage(): ReactElement {
  const { data: incomes, isLoading: incomesLoading, isError: incomesError } = useIncomes();
  const { data: clients = [] } = useClients();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [incomeToEdit, setIncomeToEdit] = useState<IncomeResponseDto | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<IncomeResponseDto | null>(null);

  const { mutate: deleteIncome, isPending: isDeleting } = useDeleteIncome();
  const { mutate: markPaid } = useMarkPaid();
  const { mutate: markUnpaid } = useMarkUnpaid();
  const { showToast } = useToast();

  const [filters, setFilters] = useState<IncomeFiltersValue>({
    clientId: 'all',
    paidStatus: 'all',
    dateFrom: '',
    dateTo: '',
  });

  const filteredIncomes = useMemo(() => {
    const items = incomes ?? [];

    return items.filter((income) => {
      if (filters.clientId !== 'all' && income.clientId !== filters.clientId) {
        return false;
      }

      if (filters.paidStatus === 'paid' && !income.isPaid) {
        return false;
      }

      if (filters.paidStatus === 'unpaid' && income.isPaid) {
        return false;
      }

      const dateOnly = String(income.date).slice(0, 10);

      if (filters.dateFrom && dateOnly < filters.dateFrom) {
        return false;
      }

      if (filters.dateTo && dateOnly > filters.dateTo) {
        return false;
      }

      return true;
    });
  }, [incomes, filters]);

  function handleTogglePaid(income: IncomeResponseDto): void {
    const mutate = income.isPaid ? markUnpaid : markPaid;

    mutate(income.id, {
      onSuccess: () => {
        showToast({
          title: 'Payment status updated',
          description: 'The income has been updated successfully.',
        });
      },
      onError: (error) => {
        console.error('Error toggling paid status:', error);
        showToast({
          title: 'Error',
          description: 'Failed to update payment status. Please try again.',
        });
      },
    });
  }

  function handleDelete(): void {
    if (!incomeToDelete) {
      return;
    }

    deleteIncome(incomeToDelete.id, {
      onSuccess: () => {
        showToast({
          title: 'Income deleted',
          description: 'The income has been removed successfully.',
        });
        setIncomeToDelete(null);
      },
      onError: (error) => {
        console.error('Error deleting income:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete income. Please try again.',
        });
      },
    });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Incomes
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            View and manage your invoices and income records. Track payments and manage client
            billing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Add income
        </button>
      </header>

      {incomesLoading && <TableSkeleton columns={9} rows={8} ariaLabel="Loading incomes" />}

      {incomesError && !incomesLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200">
          We couldn&apos;t load your incomes right now. Please try again shortly.
        </div>
      )}

      {!incomesLoading && !incomesError && (
        <>
          {filteredIncomes.length === 0 ? (
            <EmptyState
              title="No incomes yet"
              description="Track your business income by adding your first invoice"
              icon={<DollarSign size={48} />}
            />
          ) : (
            <>
              <IncomeFilters clients={clients} value={filters} onChange={setFilters} />
              <IncomesTable
                incomes={filteredIncomes}
                onEdit={(income) => setIncomeToEdit(income)}
                onDelete={(income) => setIncomeToDelete(income)}
                onTogglePaid={handleTogglePaid}
              />
            </>
          )}

          {isCreateOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add income"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Add income
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <IncomeForm clients={clients} onSuccess={() => setIsCreateOpen(false)} />
              </div>
            </div>
          )}

          {incomeToEdit && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Edit income"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Edit income
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIncomeToEdit(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <IncomeForm
                  clients={clients}
                  initialValues={incomeToEdit}
                  incomeId={incomeToEdit.id}
                  onSuccess={() => setIncomeToEdit(null)}
                />
              </div>
            </div>
          )}

          <ConfirmationDialog
            open={incomeToDelete !== null}
            onOpenChange={(open) => {
              if (!open) {
                setIncomeToDelete(null);
              }
            }}
            title="Delete income"
            description={
              incomeToDelete ? (
                <>
                  Are you sure you want to delete{' '}
                  <strong>
                    {formatCents(incomeToDelete.totalCents)} from {incomeToDelete.client.name} (
                    {incomeToDelete.invoiceNum || 'No invoice number'}) on{' '}
                    {String(incomeToDelete.date).slice(0, 10)}
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
