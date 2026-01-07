import type { ReactElement } from 'react';
import { X, Loader2 } from 'lucide-react';
import { ProviderForm } from '@/features/settings/providers/components/provider-form';
import { useCategories } from '@/hooks/use-categories';
import type { components } from '@shared/types';

type Provider = components['schemas']['Provider'];

interface CreateProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (provider: Provider) => void;
  suggestedName?: string;
}

/**
 * Modal for creating a provider inline during CSV import.
 *
 * Pre-fills the provider name from CSV data if available.
 *
 * @example
 * <CreateProviderModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSuccess={handleProviderCreated}
 *   suggestedName="GitHub.com"
 * />
 */
export function CreateProviderModal({
  isOpen,
  onClose,
  onSuccess,
  suggestedName,
}: CreateProviderModalProps): ReactElement | null {
  const { data: categories, isLoading } = useCategories();

  if (!isOpen) return null;

  const handleSuccess = (provider: Provider): void => {
    onSuccess(provider);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-provider-title"
    >
      <div
        className="relative w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2
            id="create-provider-title"
            className="text-xl font-semibold text-slate-900 dark:text-slate-50"
          >
            Create New Provider
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
              Creating provider for: <strong>{suggestedName}</strong>
            </p>
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-500">
              You can edit the name below if needed.
            </p>
          </div>
        )}

        {/* Provider Form */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
              Loading categories...
            </span>
          </div>
        ) : (
          <ProviderForm
            categories={categories || []}
            onSuccess={handleSuccess}
            initialValues={
              suggestedName
                ? {
                    name: suggestedName,
                    isInternational: false, // Safe default
                    defaultCategoryId: '',
                    abnArn: '',
                  }
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
}
