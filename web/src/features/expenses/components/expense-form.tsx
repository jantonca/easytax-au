import type { ReactElement } from 'react';
import { useEffect } from 'react';
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
import { useToast } from '@/lib/toast-context';

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
  const { showToast } = useToast();

  const submitting = isSubmitting || isCreating || isUpdating;

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

    const payload = {
      date: values.date,
      amountCents: amountCurrency.cents,
      gstCents: gstCurrency?.cents,
      bizPercent: values.bizPercent,
      providerId: values.providerId,
      categoryId: values.categoryId,
      description: values.description || undefined,
      fileRef: values.fileRef || undefined,
    };

    if (isEditMode) {
      updateExpense(
        { id: expenseId, data: payload },
        {
          onSuccess: () => {
            showToast({
              title: 'Expense updated',
              description: 'The expense has been updated successfully.',
            });
            onSuccess?.();
          },
          onError: (error) => {
            console.error('Error updating expense:', error);
            showToast({
              title: 'Error',
              description: 'Failed to update expense. Please try again.',
            });
          },
        },
      );
    } else {
      createExpense(
        { data: payload },
        {
          onSuccess: () => {
            showToast({
              title: 'Expense created',
              description: 'The expense has been saved successfully.',
            });
            reset();
            onSuccess?.();
          },
          onError: (error) => {
            console.error('Error creating expense:', error);
            showToast({
              title: 'Error',
              description: 'Failed to save expense. Please try again.',
            });
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
        <div className="flex flex-col gap-1 text-xs text-slate-200">
          <label htmlFor="expense-date" className="text-[11px] font-medium text-slate-300">
            Date
          </label>
          <input
            id="expense-date"
            type="date"
            className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
            {...register('date')}
          />
          {errors.date && <p className="text-[11px] text-red-400">{errors.date.message}</p>}
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-200">
          <label htmlFor="expense-amount" className="text-[11px] font-medium text-slate-300">
            Amount (AUD)
          </label>
          <input
            id="expense-amount"
            type="text"
            inputMode="decimal"
            className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
            placeholder="$0.00"
            {...register('amount')}
          />
          {errors.amount && <p className="text-[11px] text-red-400">{errors.amount.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1 text-xs text-slate-200">
          <label htmlFor="expense-gst" className="text-[11px] font-medium text-slate-300">
            GST (optional)
          </label>
          <input
            id="expense-gst"
            type="text"
            inputMode="decimal"
            className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
            placeholder="$0.00"
            {...register('gstAmount')}
          />
          <p className="text-[10px] text-slate-500">
            Leave blank to auto-calculate GST from total for domestic providers; international
            providers always use $0 GST.
          </p>
        </div>

        <div className="flex flex-col gap-1 text-xs text-slate-200">
          <label htmlFor="expense-biz" className="text-[11px] font-medium text-slate-300">
            Business use %
          </label>
          <input
            id="expense-biz"
            type="number"
            min={0}
            max={100}
            className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
            {...register('bizPercent', { valueAsNumber: true })}
          />
          {errors.bizPercent && (
            <p className="text-[11px] text-red-400">{errors.bizPercent.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1 text-xs text-slate-200">
          <label htmlFor="expense-provider" className="text-[11px] font-medium text-slate-300">
            Provider
          </label>
          <select
            id="expense-provider"
            className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
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

        <div className="flex flex-col gap-1 text-xs text-slate-200">
          <label htmlFor="expense-category" className="text-[11px] font-medium text-slate-300">
            Category
          </label>
          <select
            id="expense-category"
            className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
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

      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="expense-description" className="text-[11px] font-medium text-slate-300">
          Description (optional)
        </label>
        <textarea
          id="expense-description"
          className="min-h-[72px] rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-[11px] text-red-400">{errors.description.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="expense-fileRef" className="text-[11px] font-medium text-slate-300">
          Receipt reference (optional)
        </label>
        <input
          id="expense-fileRef"
          type="text"
          className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
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
