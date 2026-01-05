import type { ReactElement } from 'react';
import { useState } from 'react';
import { Store } from 'lucide-react';
import type { ProviderDto } from '@/lib/api-client';
import { ProvidersTable } from '@/features/settings/providers/components/providers-table';
import { ProviderForm } from '@/features/settings/providers/components/provider-form';
import { useDeleteProvider } from '@/features/settings/providers/hooks/use-provider-mutations';
import { useProviders } from '@/hooks/use-providers';
import { useCategories } from '@/hooks/use-categories';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/lib/toast-context';
import { SettingsTabs } from '@/features/settings/components/settings-tabs';
import { TableSkeleton } from '@/components/skeletons/table-skeleton';

export function ProvidersPage(): ReactElement {
  const { data: providers, isLoading: providersLoading, isError: providersError } = useProviders();
  const { data: categories = [] } = useCategories();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [providerToEdit, setProviderToEdit] = useState<ProviderDto | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<ProviderDto | null>(null);

  const { mutate: deleteProvider, isPending: isDeleting } = useDeleteProvider();
  const { showToast } = useToast();

  function handleDelete(): void {
    if (!providerToDelete) {
      return;
    }

    deleteProvider(providerToDelete.id, {
      onSuccess: () => {
        showToast({
          title: 'Provider deleted',
          description: 'The provider has been removed successfully.',
        });
        setProviderToDelete(null);
      },
      onError: (error) => {
        console.error('Error deleting provider:', error);
        showToast({
          title: 'Error',
          description: 'Failed to delete provider. Please try again.',
        });
      },
    });
  }

  return (
    <section className="mx-auto flex max-w-5xl flex-col gap-3">
      <SettingsTabs />
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">Providers</h1>
          <p className="text-sm text-slate-400">
            Manage expense vendors with GST rules and default categories.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500"
        >
          Add provider
        </button>
      </header>

      {providersLoading && <TableSkeleton columns={4} rows={6} ariaLabel="Loading providers" />}

      {providersError && !providersLoading && (
        <div className="rounded-lg border border-red-900/60 bg-red-950/60 p-4 text-sm text-red-200">
          We couldn&apos;t load your providers right now. Please try again shortly.
        </div>
      )}

      {!providersLoading && !providersError && (
        <>
          {!providers || providers.length === 0 ? (
            <EmptyState
              title="No providers yet"
              description="Add providers to track which vendors you pay for expenses"
              icon={<Store size={48} />}
            />
          ) : (
            <ProvidersTable
              providers={providers}
              onEdit={(provider) => setProviderToEdit(provider)}
              onDelete={(provider) => setProviderToDelete(provider)}
            />
          )}

          {isCreateOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Add provider"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-50">
                    Add provider
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <ProviderForm categories={categories} onSuccess={() => setIsCreateOpen(false)} />
              </div>
            </div>
          )}

          {providerToEdit && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Edit provider"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            >
              <div className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-950 p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight text-slate-50">
                    Edit provider
                  </h2>
                  <button
                    type="button"
                    onClick={() => setProviderToEdit(null)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </button>
                </div>
                <ProviderForm
                  categories={categories}
                  initialValues={providerToEdit}
                  providerId={providerToEdit.id}
                  onSuccess={() => setProviderToEdit(null)}
                />
              </div>
            </div>
          )}

          <ConfirmationDialog
            open={providerToDelete !== null}
            onOpenChange={(open) => {
              if (!open) {
                setProviderToDelete(null);
              }
            }}
            title="Delete provider"
            description={
              providerToDelete ? (
                <>
                  Are you sure you want to delete <strong>{providerToDelete.name}</strong>? This
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
