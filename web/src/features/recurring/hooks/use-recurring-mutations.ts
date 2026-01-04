import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  createRecurringExpense,
  updateRecurringExpense,
  deleteRecurringExpense,
  generateRecurringExpenses,
  type RecurringExpenseResponseDto,
  type CreateRecurringExpenseDto,
  type UpdateRecurringExpenseDto,
  type GenerateExpensesResultDto,
} from '@/lib/api-client';

export function useCreateRecurring(): UseMutationResult<
  RecurringExpenseResponseDto,
  Error,
  CreateRecurringExpenseDto
> {
  const queryClient = useQueryClient();

  return useMutation<RecurringExpenseResponseDto, Error, CreateRecurringExpenseDto>({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

export function useUpdateRecurring(): UseMutationResult<
  RecurringExpenseResponseDto,
  Error,
  { id: string; dto: UpdateRecurringExpenseDto }
> {
  const queryClient = useQueryClient();

  return useMutation<
    RecurringExpenseResponseDto,
    Error,
    { id: string; dto: UpdateRecurringExpenseDto }
  >({
    mutationFn: ({ id, dto }) => updateRecurringExpense(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

export function useDeleteRecurring(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
    },
  });
}

export function useGenerateRecurring(): UseMutationResult<
  GenerateExpensesResultDto,
  Error,
  string | undefined
> {
  const queryClient = useQueryClient();

  return useMutation<GenerateExpensesResultDto, Error, string | undefined>({
    mutationFn: (asOfDate) => generateRecurringExpenses(asOfDate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
