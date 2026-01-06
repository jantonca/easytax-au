import { useEffect, useMemo } from 'react';
import type { JSX } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  recurringExpenseSchema,
  type RecurringExpenseFormValues,
} from '../schemas/recurring.schema';
import { useCreateRecurring, useUpdateRecurring } from '../hooks/use-recurring-mutations';
import { Button } from '@/components/ui/button';
import { parseCurrency, formatCents } from '@/lib/currency';
import { useProviders } from '@/hooks/use-providers';
import { useCategories } from '@/hooks/use-categories';
import type { RecurringExpenseResponseDto } from '@/lib/api-client';

interface RecurringFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: RecurringExpenseResponseDto;
  recurringId?: string;
}

export function RecurringForm({
  onSuccess,
  onCancel,
  initialValues,
  recurringId,
}: RecurringFormProps): JSX.Element {
  const isEditMode = Boolean(recurringId && initialValues);
  const { data: providers = [] } = useProviders();
  const { data: categories = [] } = useCategories();
  const { mutate: createRecurring, isPending: isCreating } = useCreateRecurring();
  const { mutate: updateRecurring, isPending: isUpdating } = useUpdateRecurring();

  const defaultValues: Partial<RecurringExpenseFormValues> =
    isEditMode && initialValues
      ? {
          name: initialValues.name,
          description:
            initialValues.description &&
            typeof initialValues.description === 'string' &&
            (initialValues.description as string).length > 0
              ? (initialValues.description as string)
              : undefined,
          amount: formatCents(initialValues.amountCents),
          gstAmount: formatCents(initialValues.gstCents),
          bizPercent: initialValues.bizPercent,
          providerId: initialValues.providerId,
          categoryId: initialValues.categoryId,
          schedule: initialValues.schedule,
          dayOfMonth: initialValues.dayOfMonth,
          startDate: initialValues.startDate,
          endDate:
            initialValues.endDate && typeof initialValues.endDate === 'string'
              ? initialValues.endDate
              : '',
          isActive: initialValues.isActive,
        }
      : {
          name: '',
          description: '',
          amount: '',
          gstAmount: '',
          bizPercent: 100,
          providerId: '',
          categoryId: '',
          schedule: 'monthly',
          dayOfMonth: 1,
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          isActive: true,
        };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RecurringExpenseFormValues>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues,
  });

  // Watch form values for real-time calculations
  const amount = watch('amount');
  const providerId = watch('providerId');
  const bizPercent = watch('bizPercent');
  const gstAmount = watch('gstAmount');

  // Auto-select first provider and category if none selected
  useEffect(() => {
    if (!isEditMode && providers.length > 0 && !watch('providerId')) {
      setValue('providerId', providers[0].id);
    }
  }, [providers, setValue, watch, isEditMode]);

  useEffect(() => {
    if (!isEditMode && categories.length > 0 && !watch('categoryId')) {
      setValue('categoryId', categories[0].id);
    }
  }, [categories, setValue, watch, isEditMode]);

  // Find selected provider for GST calculations
  const selectedProvider = useMemo(() => {
    return providers.find((p) => p.id === providerId);
  }, [providers, providerId]);

  // Calculate GST automatically based on provider type
  const calculatedGst = useMemo(() => {
    if (!amount || !selectedProvider) return '0.00';

    const amountCents = parseCurrency(amount).cents;
    if (amountCents === 0) return '0.00';

    // International providers: GST is always $0
    if (selectedProvider.isInternational) {
      return '0.00';
    }

    // Domestic providers: GST = 1/11 of total
    const gstCents = Math.round(amountCents / 11);
    return formatCents(gstCents);
  }, [amount, selectedProvider]);

  // Calculate claimable GST
  const claimableGst = useMemo(() => {
    const gstCents =
      gstAmount && gstAmount.trim() !== ''
        ? parseCurrency(gstAmount).cents
        : parseCurrency(calculatedGst).cents;
    const claimable = Math.round((gstCents * bizPercent) / 100);
    return formatCents(claimable);
  }, [gstAmount, calculatedGst, bizPercent]);

  const submitting = isSubmitting || isCreating || isUpdating;

  const onSubmit = (data: RecurringExpenseFormValues): void => {
    const amountCents = parseCurrency(data.amount).cents;
    const gstCents =
      data.gstAmount && data.gstAmount.trim() !== ''
        ? parseCurrency(data.gstAmount).cents
        : parseCurrency(calculatedGst).cents;

    const payload = {
      name: data.name,
      description:
        data.description && data.description.trim() !== '' ? data.description : undefined,
      amountCents,
      gstCents,
      bizPercent: data.bizPercent,
      currency: 'AUD',
      providerId: data.providerId,
      categoryId: data.categoryId,
      schedule: data.schedule,
      dayOfMonth: data.dayOfMonth,
      startDate: data.startDate,
      endDate: data.endDate && data.endDate.trim() !== '' ? data.endDate : undefined,
      isActive: data.isActive,
    };

    if (isEditMode && recurringId) {
      updateRecurring(
        { id: recurringId, dto: payload },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        },
      );
    } else {
      createRecurring(payload, {
        onSuccess: () => {
          onSuccess?.();
        },
      });
    }
  };

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(onSubmit)(e);
      }}
      className="space-y-4"
    >
      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
          placeholder="e.g., iinet Internet"
        />
        {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Description (optional)
        </label>
        <input
          id="description"
          type="text"
          {...register('description')}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
          placeholder="e.g., Monthly internet service"
        />
        {errors.description && (
          <p className="mt-1 text-[11px] text-red-400">{errors.description.message}</p>
        )}
      </div>

      {/* Provider */}
      <div>
        <label
          htmlFor="providerId"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Provider <span className="text-red-500">*</span>
        </label>
        <select
          id="providerId"
          {...register('providerId')}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
        >
          {providers.length === 0 && <option value="">Loading providers...</option>}
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}{' '}
              {provider.isInternational ? '(International - GST Free)' : '(Domestic)'}
            </option>
          ))}
        </select>
        {errors.providerId && (
          <p className="mt-1 text-[11px] text-red-400">{errors.providerId.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="categoryId"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="categoryId"
          {...register('categoryId')}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
        >
          {categories.length === 0 && <option value="">Loading categories...</option>}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name} ({category.basLabel})
            </option>
          ))}
        </select>
        {errors.categoryId && (
          <p className="mt-1 text-[11px] text-red-400">{errors.categoryId.message}</p>
        )}
      </div>

      {/* Amount and GST */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="amount"
            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
          >
            Amount (inc GST) <span className="text-red-500">*</span>
          </label>
          <input
            id="amount"
            type="text"
            {...register('amount')}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            placeholder="110.00"
          />
          {errors.amount && (
            <p className="mt-1 text-[11px] text-red-400">{errors.amount.message}</p>
          )}
          {/* GST auto-calculation display */}
          {selectedProvider && (
            <p className="mt-1 text-[10px] text-emerald-400">
              {selectedProvider.isInternational
                ? 'GST: $0.00 (international provider)'
                : `GST: $${calculatedGst} (auto-calculated)`}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="gstAmount"
            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
          >
            GST (optional override)
          </label>
          <input
            id="gstAmount"
            type="text"
            {...register('gstAmount')}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            placeholder={calculatedGst}
          />
          {errors.gstAmount && (
            <p className="mt-1 text-[11px] text-red-400">{errors.gstAmount.message}</p>
          )}
        </div>
      </div>

      {/* Business Use Percentage */}
      <div>
        <label
          htmlFor="bizPercent"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Business Use: <span className="text-emerald-400 font-semibold">{bizPercent}%</span>
        </label>
        <input
          id="bizPercent"
          type="range"
          min="0"
          max="100"
          step="5"
          {...register('bizPercent', { valueAsNumber: true })}
          className="mt-2 block w-full accent-emerald-600"
          aria-label={`Business use percentage: ${bizPercent}%`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={bizPercent}
        />
        <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-400">
          Claimable GST: <span className="font-semibold">${claimableGst}</span> ({bizPercent}% of $
          {gstAmount && gstAmount.trim() !== '' ? gstAmount : calculatedGst})
        </p>
        {errors.bizPercent && (
          <p className="mt-1 text-[11px] text-red-400">{errors.bizPercent.message}</p>
        )}
      </div>

      {/* Schedule */}
      <div>
        <label
          htmlFor="schedule"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Schedule <span className="text-red-500">*</span>
        </label>
        <select
          id="schedule"
          {...register('schedule')}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
        {errors.schedule && (
          <p className="mt-1 text-[11px] text-red-400">{errors.schedule.message}</p>
        )}
      </div>

      {/* Day of Month */}
      <div>
        <label
          htmlFor="dayOfMonth"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Day of Month (1-28) <span className="text-red-500">*</span>
        </label>
        <input
          id="dayOfMonth"
          type="number"
          min="1"
          max="28"
          {...register('dayOfMonth', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
        />
        <p className="mt-1 text-[10px] text-slate-600 dark:text-slate-400">
          Use 1-28 to avoid month-end date issues
        </p>
        {errors.dayOfMonth && (
          <p className="mt-1 text-[11px] text-red-400">{errors.dayOfMonth.message}</p>
        )}
      </div>

      {/* Start and End Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
          >
            Start Date <span className="text-red-500">*</span>
          </label>
          <input
            id="startDate"
            type="date"
            {...register('startDate')}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
          />
          {errors.startDate && (
            <p className="mt-1 text-[11px] text-red-400">{errors.startDate.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="endDate"
            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
          >
            End Date (optional)
          </label>
          <input
            id="endDate"
            type="date"
            {...register('endDate')}
            className="mt-1 block w-full rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
          />
          {errors.endDate && (
            <p className="mt-1 text-[11px] text-red-400">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Is Active Toggle */}
      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          {...register('isActive')}
          className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
        />
        <label
          htmlFor="isActive"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Active (uncheck to pause this recurring expense)
        </label>
        {errors.isActive && (
          <p className="ml-2 text-[11px] text-red-400">{errors.isActive.message}</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" onClick={onCancel} disabled={submitting} variant="outline">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting
            ? isEditMode
              ? 'Updating...'
              : 'Creating...'
            : isEditMode
              ? 'Update'
              : 'Create'}
        </Button>
      </div>
    </form>
  );
}
