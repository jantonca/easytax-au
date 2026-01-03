import type { ReactElement } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { CategoryDto } from '@/lib/api-client';
import type { CategoryFormValues } from '@/features/settings/categories/schemas/category.schema';
import { categoryFormSchema } from '@/features/settings/categories/schemas/category.schema';
import {
  useCreateCategory,
  useUpdateCategory,
} from '@/features/settings/categories/hooks/use-category-mutations';
import { useToast } from '@/lib/toast-context';

interface CategoryFormProps {
  initialValues?: CategoryDto;
  categoryId?: string;
  onSuccess?: () => void;
}

export function CategoryForm({
  initialValues,
  categoryId,
  onSuccess,
}: CategoryFormProps): ReactElement {
  const isEditMode = !!categoryId;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: initialValues
      ? {
          name: initialValues.name,
          basLabel: initialValues.basLabel,
          isDeductible: initialValues.isDeductible,
          description: initialValues.description ?? '',
        }
      : {
          name: '',
          basLabel: '1B',
          isDeductible: true,
          description: '',
        },
  });

  const { mutate: createCategory, isPending: isCreating } = useCreateCategory();
  const { mutate: updateCategory, isPending: isUpdating } = useUpdateCategory();
  const { showToast } = useToast();

  const submitting = isSubmitting || isCreating || isUpdating;

  function onSubmit(values: CategoryFormValues): void {
    const payload: {
      name: string;
      basLabel: string;
      isDeductible: boolean;
      description?: string;
    } = {
      name: values.name,
      basLabel: values.basLabel,
      isDeductible: values.isDeductible,
    };

    // Only include description if it has a value
    if (values.description && values.description.length > 0) {
      payload.description = values.description;
    }

    if (isEditMode) {
      updateCategory(
        { id: categoryId, data: payload },
        {
          onSuccess: () => {
            showToast({
              title: 'Category updated',
              description: 'The category has been updated successfully.',
            });
            onSuccess?.();
          },
          onError: (error) => {
            console.error('Error updating category:', error);
            showToast({
              title: 'Error',
              description: 'Failed to update category. Please try again.',
            });
          },
        },
      );
    } else {
      createCategory(
        { data: payload },
        {
          onSuccess: () => {
            showToast({
              title: 'Category created',
              description: 'The category has been saved successfully.',
            });
            reset();
            onSuccess?.();
          },
          onError: (error) => {
            console.error('Error creating category:', error);
            showToast({
              title: 'Error',
              description: 'Failed to save category. Please try again.',
            });
          },
        },
      );
    }
  }

  return (
    <form
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onSubmit={handleSubmit((values: CategoryFormValues): void => {
        onSubmit(values);
      })}
      className="space-y-3"
    >
      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="category-name" className="text-[11px] font-medium text-slate-300">
          Category name
        </label>
        <input
          id="category-name"
          type="text"
          className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
          placeholder="Software, Hosting, Internet, etc."
          {...register('name')}
        />
        {errors.name && <p className="text-[11px] text-red-400">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="category-bas-label" className="text-[11px] font-medium text-slate-300">
          BAS label
        </label>
        <select
          id="category-bas-label"
          className="h-8 rounded-md border border-slate-800 bg-slate-950 px-2 text-xs text-slate-100"
          {...register('basLabel')}
        >
          <option value="1B">1B - Purchases for making sales (most common)</option>
          <option value="G10">G10 - Capital purchases</option>
          <option value="G11">G11 - Non-capital purchases</option>
        </select>
        {errors.basLabel && <p className="text-[11px] text-red-400">{errors.basLabel.message}</p>}
        <p className="text-[10px] text-slate-500">
          ATO BAS label for reporting. Most business expenses use 1B.
        </p>
      </div>

      <div className="flex items-start gap-2">
        <input
          id="category-deductible"
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-emerald-600"
          {...register('isDeductible')}
        />
        <div className="flex flex-col gap-1">
          <label htmlFor="category-deductible" className="text-[11px] font-medium text-slate-300">
            Tax deductible
          </label>
          <p className="text-[10px] text-slate-500">
            Uncheck if this expense type is not tax deductible.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-slate-200">
        <label htmlFor="category-description" className="text-[11px] font-medium text-slate-300">
          Description (optional)
        </label>
        <textarea
          id="category-description"
          className="min-h-[72px] rounded-md border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          placeholder="Optional notes about this category..."
          {...register('description')}
        />
        {errors.description && (
          <p className="text-[11px] text-red-400">{errors.description.message}</p>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="submit"
          className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? 'Saving…' : isEditMode ? 'Update category' : 'Save category'}
        </button>
      </div>
    </form>
  );
}
