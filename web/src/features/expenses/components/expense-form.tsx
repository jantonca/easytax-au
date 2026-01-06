import type { ReactElement } from 'react';
import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CategoryDto, ExpenseResponseDto, ProviderDto } from '@/lib/api-client';
import { formatCents, parseCurrency } from '@/lib/currency';
import type { ExpenseFormValues } from '@/features/expenses/schemas/expense.schema';
import { expenseFormSchema } from '@/features/expenses/schemas/expense.schema';
import {
  useCreateExpense,
  useUpdateExpense,
} from '@/features/expenses/hooks/use-expense-mutations';

interface ExpenseFormProps {
  providers: ProviderDto[];
  categories: CategoryDto[];
  initialValues?: ExpenseResponseDto;
  expenseId?: string;
  onSuccess?: () => void;
}

export function ExpenseForm({
  providers,
  categories,
  initialValues,
  expenseId,
  onSuccess,
}: ExpenseFormProps): ReactElement {
  const isEditMode = !!expenseId;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: initialValues
      ? {
          date: String(initialValues.date).slice(0, 10),
          amount: formatCents(initialValues.amountCents),
          gstAmount: formatCents(initialValues.gstCents),
          bizPercent: initialValues.bizPercent,
          providerId: initialValues.providerId,
          categoryId: initialValues.categoryId,
          description: (() => {
            const raw = (initialValues as unknown as { description?: unknown }).description;
            return typeof raw === 'string' ? raw : '';
          })(),
          fileRef: (() => {
            const raw = (initialValues as unknown as { fileRef?: unknown }).fileRef;
            return typeof raw === 'string' ? raw : '';
          })(),
        }
      : {
          date: '',
          amount: '',
          gstAmount: '',
          bizPercent: 100,
          providerId: '',
          categoryId: '',
          description: '',
          fileRef: '',
        },
  });

  const { mutate: createExpense, isPending: isCreating } = useCreateExpense();
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense();

  const submitting = isSubmitting || isCreating || isUpdating;

  // Watch form values for real-time calculations
  const amount = watch('amount');
  const providerId = watch('providerId');
  const bizPercent = watch('bizPercent');
  const gstAmount = watch('gstAmount');

  // Find selected provider
  const selectedProvider = useMemo(() => {
    return providers.find((p) => p.id === providerId);
  }, [providers, providerId]);

  // Calculate GST based on amount and provider type
  const calculatedGst = useMemo(() => {
    if (!amount || !selectedProvider) return null;

    const parsed = parseCurrency(amount);
    if (!parsed || parsed.cents <= 0) return null;

    if (selectedProvider.isInternational) {
      return { cents: 0, isInternational: true };
    }

    // GST = 1/11 of total for domestic providers
    const gstCents = Math.round(parsed.cents / 11);
    return { cents: gstCents, isInternational: false };
  }, [amount, selectedProvider]);

  // Calculate claimable GST based on bizPercent
  const claimableGst = useMemo(() => {
    // Use manual GST if entered, otherwise use calculated
    const gst = gstAmount ? parseCurrency(gstAmount)?.cents : calculatedGst?.cents;

    if (!gst || bizPercent === undefined || bizPercent === null) return null;

    return Math.round((gst * bizPercent) / 100);
  }, [gstAmount, calculatedGst, bizPercent]);

  useEffect(() => {
    if (!providers.length || !categories.length) {
      return;
    }

    // If defaults are empty, preselect the first provider/category
    reset((current) => ({
      ...current,
      providerId: current.providerId || providers[0]?.id || '',
      categoryId: current.categoryId || categories[0]?.id || '',
    }));
  }, [providers, categories, reset]);

  function onSubmit(values: ExpenseFormValues): void {
    const amountCurrency = parseCurrency(values.amount);
    const gstCurrency = values.gstAmount ? parseCurrency(values.gstAmount) : undefined;

    // Build payload with only defined optional fields
    const payload: {
      date: string;
      amountCents: number;
      bizPercent: number;
      providerId: string;
      categoryId: string;
      gstCents?: number;
      description?: string;
      fileRef?: string;
    } = {
      date: values.date,
      amountCents: amountCurrency.cents,
      bizPercent: values.bizPercent,
      providerId: values.providerId,
      categoryId: values.categoryId,
    };

    // Only include optional fields if they have values
    if (gstCurrency) {
      payload.gstCents = gstCurrency.cents;
    }
    if (values.description) {
      payload.description = values.description;
    }
    if (values.fileRef) {
      payload.fileRef = values.fileRef;
    }

    if (isEditMode) {
      updateExpense(
        { id: expenseId, data: payload },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        },
      );
    } else {
      createExpense(
        { data: payload },
        {
          onSuccess: () => {
            reset();
            onSuccess?.();
          },
        },
      );
    }
  }

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={handleSubmit((values: ExpenseFormValues): void => {
        onSubmit(values);
      })}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="expense-date"
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            Date
          </label>
          <input
            id="expense-date"
            type="date"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            {...register('date')}
          />
          {errors.date && <p className="text-[11px] text-red-400">{errors.date.message}</p>}
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="expense-amount"
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            Amount (AUD)
          </label>
          <input
            id="expense-amount"
            type="text"
            inputMode="decimal"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            placeholder="$0.00"
            {...register('amount')}
          />
          {errors.amount && <p className="text-[11px] text-red-400">{errors.amount.message}</p>}
          {calculatedGst && (
            <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
              {calculatedGst.isInternational
                ? 'GST: $0.00 (international provider)'
                : `Calculated GST: ${formatCents(calculatedGst.cents)}`}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="expense-gst"
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            GST (optional)
          </label>
          <input
            id="expense-gst"
            type="text"
            inputMode="decimal"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            placeholder="$0.00"
            {...register('gstAmount')}
          />
          <p className="text-[10px] text-slate-600 dark:text-slate-400">
            Leave blank to auto-calculate GST from total for domestic providers; international
            providers always use $0 GST.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-xs text-slate-700 dark:text-slate-200">
          <div className="flex items-center justify-between">
            <label
              htmlFor="expense-biz"
              className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
            >
              Business use %
            </label>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {bizPercent}%
            </span>
          </div>
          <input
            id="expense-biz"
            type="range"
            min={0}
            max={100}
            step={5}
            aria-label="Business use percentage"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={bizPercent}
            className="w-full accent-emerald-600"
            {...register('bizPercent', { valueAsNumber: true })}
          />
          <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400">
            <span>0%</span>
            <span>100%</span>
          </div>
          {errors.bizPercent && (
            <p className="text-[11px] text-red-400">{errors.bizPercent.message}</p>
          )}
          {claimableGst !== null && (
            <p className="text-[10px] text-slate-600 dark:text-slate-400">
              Claimable GST: {formatCents(claimableGst)} ({bizPercent}% of{' '}
              {formatCents(
                gstAmount ? parseCurrency(gstAmount)?.cents || 0 : calculatedGst?.cents || 0,
              )}
              )
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="expense-provider"
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            Provider
          </label>
          <select
            id="expense-provider"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            {...register('providerId')}
          >
            <option value="">Select a provider…</option>
            {providers.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          {errors.providerId && (
            <p className="text-[11px] text-red-400">{errors.providerId.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="expense-category"
            className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            Category
          </label>
          <select
            id="expense-category"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            {...register('categoryId')}
          >
            <option value="">Select a category…</option>
            {categories.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-[11px] text-red-400">{errors.categoryId.message}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
        <label
          htmlFor="expense-description"
          className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
        >
          Description (optional)
        </label>
        <textarea
          id="expense-description"
          className="min-h-18 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-[11px] text-red-400">{errors.description.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
        <label
          htmlFor="expense-fileRef"
          className="text-[11px] font-medium text-slate-600 dark:text-slate-300"
        >
          Receipt reference (optional)
        </label>
        <input
          id="expense-fileRef"
          type="text"
          className="h-8 rounded-md border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
          placeholder="receipt-github-2024-01.pdf"
          {...register('fileRef')}
        />
        {errors.fileRef && <p className="text-[11px] text-red-400">{errors.fileRef.message}</p>}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : isEditMode ? 'Update expense' : 'Save expense'}
        </button>
      </div>
    </form>
  );
}
