import type { ReactElement } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { ClientDto } from '@/lib/api-client';
import type { ClientFormValues } from '@/features/settings/clients/schemas/client.schema';
import { clientFormSchema } from '@/features/settings/clients/schemas/client.schema';
import {
  useCreateClient,
  useUpdateClient,
} from '@/features/settings/clients/hooks/use-client-mutations';
import { useToast } from '@/lib/toast-context';

interface ClientFormProps {
  initialValues?: ClientDto;
  clientId?: string;
  onSuccess?: () => void;
}

export function ClientForm({ initialValues, clientId, onSuccess }: ClientFormProps): ReactElement {
  const isEditMode = !!clientId;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          abn: initialValues.abn ?? '',
          isPsiEligible: initialValues.isPsiEligible,
        }
      : {
          name: '',
          abn: '',
          isPsiEligible: false,
        },
  });

  const { mutate: createClient, isPending: isCreating } = useCreateClient();
  const { mutate: updateClient, isPending: isUpdating } = useUpdateClient();
  const { showToast } = useToast();

  const submitting = isSubmitting || isCreating || isUpdating;

  function onSubmit(values: ClientFormValues): void {
    const payload: {
      name: string;
      abn?: string;
      isPsiEligible: boolean;
    } = {
      name: values.name,
      isPsiEligible: values.isPsiEligible,
    };

    // Only include ABN if it has a value
    if (values.abn && values.abn.length > 0) {
      payload.abn = values.abn;
    }

    if (isEditMode) {
      updateClient(
        { id: clientId, data: payload },
        {
          onSuccess: () => {
            showToast({
              title: 'Client updated',
              description: 'The client has been updated successfully.',
            });
            onSuccess?.();
          },
          onError: (error) => {
            console.error('Error updating client:', error);
            showToast({
              title: 'Error',
              description: 'Failed to update client. Please try again.',
            });
          },
        },
      );
    } else {
      createClient(
        { data: payload },
        {
          onSuccess: () => {
            showToast({
              title: 'Client created',
              description: 'The client has been saved successfully.',
            });
            reset();
            onSuccess?.();
          },
          onError: (error) => {
            console.error('Error creating client:', error);
            showToast({
              title: 'Error',
              description: 'Failed to save client. Please try again.',
            });
          },
        },
      );
    }
  }

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={handleSubmit((values: ClientFormValues): void => {
        onSubmit(values);
      })}
      className="space-y-3"
    >
      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="client-name" className="text-[11px] font-medium text-slate-300">
          Client name 🔒
        </label>
        <input
          id="client-name"
          type="text"
          className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
          placeholder="Acme Corp, etc."
          {...register('name')}
        />
        {errors.name && <p className="text-[11px] text-red-400">{errors.name.message}</p>}
        <p className="text-[10px] text-slate-500">
          Client names are encrypted at rest for privacy.
        </p>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="client-abn" className="text-[11px] font-medium text-slate-300">
          ABN (optional) 🔒
        </label>
        <input
          id="client-abn"
          type="text"
          inputMode="numeric"
          className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
          placeholder="12345678901 (11 digits)"
          {...register('abn')}
        />
        {errors.abn && <p className="text-[11px] text-red-400">{errors.abn.message}</p>}
        <p className="text-[10px] text-slate-500">
          ABN must be 11 digits. Also encrypted at rest for privacy.
        </p>
      </div>

      <div className="flex items-start gap-2">
        <input
          id="client-psi-eligible"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-600"
          {...register('isPsiEligible')}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="client-psi-eligible" className="text-[11px] font-medium text-slate-300">
            PSI (Personal Services Income) eligible
          </label>
          <p className="text-[10px] text-slate-500">
            Check this if Personal Services Income rules may apply to this client. This affects how
            income is reported for tax purposes.
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : isEditMode ? 'Update client' : 'Save client'}
        </button>
      </div>
    </form>
  );
}
