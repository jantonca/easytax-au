import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CategoryDto, ProviderDto } from '@/lib/api-client';
import type { ProviderFormValues } from '@/features/settings/providers/schemas/provider.schema';
import { providerFormSchema } from '@/features/settings/providers/schemas/provider.schema';
import {
  useCreateProvider,
  useUpdateProvider,
} from '@/features/settings/providers/hooks/use-provider-mutations';
import { useToast } from '@/lib/toast-context';

interface ProviderFormProps {
  categories: CategoryDto[];
  initialValues?: ProviderDto;
  providerId?: string;
  onSuccess?: () => void;
}

export function ProviderForm({
  categories,
  initialValues,
  providerId,
  onSuccess,
}: ProviderFormProps): ReactElement {
  const isEditMode = !!providerId;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerFormSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          isInternational: initialValues.isInternational,
          defaultCategoryId: initialValues.defaultCategoryId ?? '',
          abnArn: initialValues.abnArn ?? '',
        }
      : {
          name: '',
          isInternational: false,
          defaultCategoryId: '',
          abnArn: '',
        },
  });

  const { mutate: createProvider, isPending: isCreating } = useCreateProvider();
  const { mutate: updateProvider, isPending: isUpdating } = useUpdateProvider();
  const { showToast } = useToast();

  const submitting = isSubmitting || isCreating || isUpdating;

  useEffect(() => {
    if (!categories.length || isEditMode) {
      return;
    }

    // Pre-select first category for new providers
    reset((current) => ({
      ...current,
      defaultCategoryId: current.defaultCategoryId || categories[0]?.id || '',
    }));
  }, [categories, isEditMode, reset]);

  function onSubmit(values: ProviderFormValues): void {
    const payload: {
      name: string;
      isInternational: boolean;
      defaultCategoryId?: string;
      abnArn?: string;
    } = {
      name: values.name,
      isInternational: values.isInternational,
    };

    // Only include optional fields if they have values
    if (values.defaultCategoryId && values.defaultCategoryId.length > 0) {
      payload.defaultCategoryId = values.defaultCategoryId;
    }
    if (values.abnArn && values.abnArn.length > 0) {
      payload.abnArn = values.abnArn;
    }

    if (isEditMode) {
      updateProvider(
        { id: providerId, data: payload },
        {
          onSuccess: () => {
            showToast({
              title: 'Provider updated',
              description: 'The provider has been updated successfully.',
            });
            onSuccess?.();
          },
          onError: (error) => {
            console.error('Error updating provider:', error);
            showToast({
              title: 'Error',
              description: 'Failed to update provider. Please try again.',
            });
          },
        },
      );
    } else {
      createProvider(
        { data: payload },
        {
          onSuccess: () => {
            showToast({
              title: 'Provider created',
              description: 'The provider has been saved successfully.',
            });
            reset();
            onSuccess?.();
          },
          onError: (error) => {
            console.error('Error creating provider:', error);
            showToast({
              title: 'Error',
              description: 'Failed to save provider. Please try again.',
            });
          },
        },
      );
    }
  }

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={handleSubmit((values: ProviderFormValues): void => {
        onSubmit(values);
      })}
      className="space-y-3"
    >
      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="provider-name" className="text-[11px] font-medium text-slate-300">
          Provider name
        </label>
        <input
          id="provider-name"
          type="text"
          className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
          placeholder="GitHub, VentraIP, etc."
          {...register('name')}
        />
        {errors.name && <p className="text-[11px] text-red-400">{errors.name.message}</p>}
      </div>

      <div className="flex items-start gap-2">
        <input
          id="provider-international"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-600"
          {...register('isInternational')}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="provider-international" className="text-[11px] font-medium text-slate-300">
            International provider (GST-free)
          </label>
          <p className="text-[10px] text-slate-500">
            International providers (GitHub, AWS, etc.) don't charge GST to Australian customers.
            Expenses from international providers will have GST set to $0.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="provider-category" className="text-[11px] font-medium text-slate-300">
          Default category (optional)
        </label>
        <select
          id="provider-category"
          className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
          {...register('defaultCategoryId')}
        >
          <option value="">No default category</option>
          {categories.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        {errors.defaultCategoryId && (
          <p className="text-[11px] text-red-400">{errors.defaultCategoryId.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="provider-abn" className="text-[11px] font-medium text-slate-300">
          ABN / ARN (optional)
        </label>
        <input
          id="provider-abn"
          type="text"
          inputMode="numeric"
          className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
          placeholder="51824753556 (ABN) or 123456789 (ARN)"
          {...register('abnArn')}
        />
        {errors.abnArn && <p className="text-[11px] text-red-400">{errors.abnArn.message}</p>}
        <p className="text-[10px] text-slate-500">
          ABN (11 digits) or ARN (9 digits) for reference only.
        </p>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : isEditMode ? 'Update provider' : 'Save provider'}
        </button>
      </div>
    </form>
  );
}
