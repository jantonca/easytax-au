import type { ReactElement } from 'react';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { ClientDto, IncomeResponseDto } from '@/lib/api-client';
import { formatCents, parseCurrency } from '@/lib/currency';
import type { IncomeFormValues } from '@/features/incomes/schemas/income.schema';
import { incomeFormSchema } from '@/features/incomes/schemas/income.schema';
import { useCreateIncome, useUpdateIncome } from '@/features/incomes/hooks/use-income-mutations';
import { ClientSelect } from './client-select';

interface IncomeFormProps {
  clients: ClientDto[];
  initialValues?: IncomeResponseDto;
  incomeId?: string;
  onSuccess?: () => void;
}

export function IncomeForm({
  clients,
  initialValues,
  incomeId,
  onSuccess,
}: IncomeFormProps): ReactElement {
  const isEditMode = !!incomeId;
  const [isGstManuallyEdited, setIsGstManuallyEdited] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: initialValues
      ? {
          date: String(initialValues.date).slice(0, 10),
          clientId: initialValues.clientId,
          invoiceNum: initialValues.invoiceNum || '',
          description: (() => {
            const raw = (initialValues as unknown as { description?: unknown }).description;
            return typeof raw === 'string' ? raw : '';
          })(),
          subtotal: formatCents(initialValues.subtotalCents),
          gst: formatCents(initialValues.gstCents),
          isPaid: initialValues.isPaid,
        }
      : {
          date: '',
          clientId: '',
          invoiceNum: '',
          description: '',
          subtotal: '',
          gst: '',
          isPaid: false,
        },
  });

  const { mutate: createIncome, isPending: isCreating } = useCreateIncome();
  const { mutate: updateIncome, isPending: isUpdating } = useUpdateIncome();

  const submitting = isSubmitting || isCreating || isUpdating;

  const subtotal = watch('subtotal');

  // Auto-select first client if none selected
  useEffect(() => {
    if (!clients.length) {
      return;
    }

    reset((current) => ({
      ...current,
      clientId: current.clientId || clients[0]?.id || '',
    }));
  }, [clients, reset]);

  // Auto-calculate GST as 10% of subtotal (unless manually edited)
  useEffect(() => {
    if (!subtotal || isGstManuallyEdited) {
      return;
    }

    try {
      const subtotalCurrency = parseCurrency(subtotal);
      const autoGst = Math.round(subtotalCurrency.cents * 0.1); // 10% GST
      setValue('gst', formatCents(autoGst));
    } catch {
      // Invalid subtotal, don't auto-calculate
    }
  }, [subtotal, isGstManuallyEdited, setValue]);

  function handleGstFocus(): void {
    // Once user manually focuses/edits GST, stop auto-calculation
    setIsGstManuallyEdited(true);
  }

  function onSubmit(values: IncomeFormValues): void {
    const subtotalCurrency = parseCurrency(values.subtotal);
    const gstCurrency = parseCurrency(values.gst);

    // Build payload with only defined optional fields
    const payload: {
      date: string;
      clientId: string;
      subtotalCents: number;
      gstCents: number;
      isPaid: boolean;
      invoiceNum?: string;
      description?: string;
    } = {
      date: values.date,
      clientId: values.clientId,
      subtotalCents: subtotalCurrency.cents,
      gstCents: gstCurrency.cents,
      isPaid: values.isPaid ?? false, // Default to false if undefined
    };

    // Only include optional fields if they have values
    if (values.invoiceNum) {
      payload.invoiceNum = values.invoiceNum;
    }
    if (values.description) {
      payload.description = values.description;
    }

    if (isEditMode) {
      updateIncome(
        { id: incomeId, data: payload },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        },
      );
    } else {
      createIncome(
        { data: payload },
        {
          onSuccess: () => {
            reset();
            setIsGstManuallyEdited(false); // Reset GST auto-calc for next form
            onSuccess?.();
          },
        },
      );
    }
  }

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={handleSubmit((values: IncomeFormValues): void => {
        onSubmit(values);
      })}
      className="space-y-3"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="income-date"
            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
          >
            Date
          </label>
          <input
            id="income-date"
            type="date"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            aria-describedby={errors.date ? 'income-date-error' : undefined}
            {...register('date')}
          />
          {errors.date && (
            <p id="income-date-error" className="text-[11px] text-red-400">
              {errors.date.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="income-invoiceNum"
            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
          >
            Invoice number (optional)
          </label>
          <input
            id="income-invoiceNum"
            type="text"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            placeholder="INV-2024-001"
            aria-describedby={errors.invoiceNum ? 'income-invoiceNum-error' : undefined}
            {...register('invoiceNum')}
          />
          {errors.invoiceNum && (
            <p id="income-invoiceNum-error" className="text-[11px] text-red-400">
              {errors.invoiceNum.message}
            </p>
          )}
        </div>
      </div>

      <ClientSelect
        clients={clients}
        value={watch('clientId')}
        onChange={(value) => setValue('clientId', value)}
        error={errors.clientId?.message}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="income-subtotal"
            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
          >
            Subtotal (AUD)
          </label>
          <input
            id="income-subtotal"
            type="text"
            inputMode="decimal"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            placeholder="$0.00"
            aria-describedby={errors.subtotal ? 'income-subtotal-error' : undefined}
            {...register('subtotal')}
          />
          {errors.subtotal && (
            <p id="income-subtotal-error" className="text-[11px] text-red-400">
              {errors.subtotal.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
          <label
            htmlFor="income-gst"
            className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
          >
            GST (AUD)
          </label>
          <input
            id="income-gst"
            type="text"
            inputMode="decimal"
            className="h-8 rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 text-xs text-slate-900 dark:text-slate-100"
            placeholder="$0.00"
            aria-describedby={errors.gst ? 'income-gst-error' : undefined}
            {...register('gst')}
            onFocus={handleGstFocus}
          />
          {errors.gst && (
            <p id="income-gst-error" className="text-[11px] text-red-400">
              {errors.gst.message}
            </p>
          )}
          <p className="text-[10px] text-slate-600 dark:text-slate-400">
            Auto-calculated as 10% of subtotal. Edit to override.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-700 dark:text-slate-200">
        <label
          htmlFor="income-description"
          className="text-[11px] font-medium text-slate-700 dark:text-slate-300"
        >
          Description (optional)
        </label>
        <textarea
          id="income-description"
          className="min-h-[72px] rounded-md border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
          aria-describedby={errors.description ? 'income-description-error' : undefined}
          {...register('description')}
        />
        {errors.description && (
          <p id="income-description-error" className="text-[11px] text-red-400">
            {errors.description.message}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          id="income-paid"
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-emerald-600"
          {...register('isPaid')}
        />
        <label htmlFor="income-paid" className="text-xs text-slate-700 dark:text-slate-200">
          Mark as paid
        </label>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : isEditMode ? 'Update income' : 'Save income'}
        </button>
      </div>
    </form>
  );
}
