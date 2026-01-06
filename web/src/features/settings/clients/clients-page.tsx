import type { ReactElement } from 'react';
import { useState } from 'react';
import { Users } from 'lucide-react';
import type { ClientDto } from '@/lib/api-client';
import { ClientsTable } from '@/features/settings/clients/components/clients-table';
import { ClientForm } from '@/features/settings/clients/components/client-form';
import { useDeleteClient } from '@/features/settings/clients/hooks/use-client-mutations';
import { useClients } from '@/hooks/use-clients';
import { useIncomes } from '@/features/incomes/hooks/use-incomes';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/lib/toast-context';
import { SettingsTabs } from '@/features/settings/components/settings-tabs';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';

export function ClientsPage(): ReactElement {
  const { data: clients, isLoading: clientsLoading, isError: clientsError } = useClients();
  const { data: incomes = [] } = useIncomes();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<ClientDto | null>(null);
  const [clientToDelete, setClientToDelete] = useState<ClientDto | null>(null);

  const { mutate: deleteClient, isPending: isDeleting } = useDeleteClient();
  const { showToast } = useToast();

  function handleDelete(): void {
    if (!clientToDelete) {
      return;
    }

    deleteClient(clientToDelete.id, {
      onSuccess: () => {
        showToast({
          title: 'Client deleted',
          description: 'The client has been removed successfully.',
        });
        setClientToDelete(null);
      },
      onError: (error) => {
        console.error('Error deleting client:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete client. Please try again.',
        });
      },
    });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <SettingsTabs />
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Clients
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage income clients. Names and ABNs are encrypted at rest for privacy.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Add client
        </button>
      </header>

      {clientsLoading && <TableSkeleton columns={5} rows={6} ariaLabel="Loading clients" />}

      {clientsError && !clientsLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200">
          We couldn&apos;t load your clients right now. Please try again shortly.
        </div>
      )}

      {!clientsLoading && !clientsError && (
        <>
          {!clients || clients.length === 0 ? (
            <EmptyState
              title="No clients yet"
              description="Add clients to track income sources"
              icon={<Users size={48} />}
            />
          ) : (
            <ClientsTable
              clients={clients}
              incomes={incomes}
              onEdit={(client) => setClientToEdit(client)}
              onDelete={(client) => setClientToDelete(client)}
            />
          )}

          {isCreateOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add client"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Add client
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <ClientForm onSuccess={() => setIsCreateOpen(false)} />
              </div>
            </div>
          )}

          {clientToEdit && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Edit client"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                    Edit client
                  </h2>
                  <button
                    type="button"
                    onClick={() => setClientToEdit(null)}
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <ClientForm
                  initialValues={clientToEdit}
                  clientId={clientToEdit.id}
                  onSuccess={() => setClientToEdit(null)}
                />
              </div>
            </div>
          )}

          <ConfirmationDialog
            open={clientToDelete !== null}
            onOpenChange={(open) => {
              if (!open) {
                setClientToDelete(null);
              }
            }}
            title="Delete client"
            description={
              clientToDelete ? (
                <>
                  Are you sure you want to delete <strong>{clientToDelete.name}</strong>? This will
                  not delete associated incomes, but they will lose their client reference.
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
