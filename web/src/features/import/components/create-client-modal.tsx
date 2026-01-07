import type { ReactElement } from 'react';
import { X } from 'lucide-react';
import { ClientForm } from '@/features/settings/clients/components/client-form';
import type { components } from '@shared/types';

type Client = components['schemas']['Client'];

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (client: Client) => void;
  suggestedName?: string;
}

/**
 * Modal for creating a client inline during CSV import.
 *
 * Pre-fills the client name from CSV data if available.
 *
 * @example
 * <CreateClientModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSuccess={handleClientCreated}
 *   suggestedName="Acme Corporation"
 * />
 */
export function CreateClientModal({
  isOpen,
  onClose,
  onSuccess,
  suggestedName,
}: CreateClientModalProps): ReactElement | null {
  if (!isOpen) return null;

  const handleSuccess = (client: Client): void => {
    onSuccess(client);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-client-title"
    >
      <div
        className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="create-client-title"
            className="text-xl font-semibold text-slate-900 dark:text-slate-50"
          >
            Create New Client
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Help Text */}
        {suggestedName && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/50">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Creating client for: <strong>{suggestedName}</strong>
            </p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
              You can edit the name below if needed.
            </p>
          </div>
        )}

        {/* Client Form */}
        <ClientForm
          onSuccess={handleSuccess}
          initialValues={
            suggestedName
              ? {
                  name: suggestedName,
                  isPsiEligible: false,
                  abn: '',
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
