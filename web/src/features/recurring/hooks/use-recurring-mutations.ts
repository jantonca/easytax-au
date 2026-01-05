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
import { useToast } from '@/lib/toast-context';

export function useCreateRecurring(): UseMutationResult<
  RecurringExpenseResponseDto,
  Error,
  CreateRecurringExpenseDto
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<RecurringExpenseResponseDto, Error, CreateRecurringExpenseDto>({
    mutationFn: createRecurringExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      showToast({ title: 'Recurring expense created successfully' });
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error, 'create recurring expense');
      showToast({ title: errorMessage });
    },
  });
}

export function useUpdateRecurring(): UseMutationResult<
  RecurringExpenseResponseDto,
  Error,
  { id: string; dto: UpdateRecurringExpenseDto }
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<
    RecurringExpenseResponseDto,
    Error,
    { id: string; dto: UpdateRecurringExpenseDto }
  >({
    mutationFn: ({ id, dto }) => updateRecurringExpense(id, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      showToast({ title: 'Recurring expense updated successfully' });
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error, 'update recurring expense');
      showToast({ title: errorMessage });
    },
  });
}

export function useDeleteRecurring(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, Error, string>({
    mutationFn: deleteRecurringExpense,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      showToast({ title: 'Recurring expense deleted successfully' });
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error, 'delete recurring expense');
      showToast({ title: errorMessage });
    },
  });
}

export function useGenerateRecurring(): UseMutationResult<
  GenerateExpensesResultDto,
  Error,
  string | undefined
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<GenerateExpensesResultDto, Error, string | undefined>({
    mutationFn: (asOfDate) => generateRecurringExpenses(asOfDate),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['recurring-expenses'] });
      void queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast({
        title: `Generated ${data.generated} expense${data.generated !== 1 ? 's' : ''} from ${data.generated + data.skipped} template${data.generated + data.skipped !== 1 ? 's' : ''}`,
      });
    },
    onError: (error: Error) => {
      const errorMessage = getErrorMessage(error, 'generate recurring expenses');
      showToast({ title: errorMessage });
    },
  });
}

/**
 * Helper function to extract error messages for toast notifications.
 * - For 4xx errors (client errors): Show specific API error message
 * - For 5xx errors (server errors): Show generic message for security
 */
function getErrorMessage(error: unknown, action: string): string {
  // Check if error has a status property (e.g., ApiError or similar)
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error &&
    typeof error.status === 'number' &&
    typeof error.message === 'string'
  ) {
    // For 4xx errors (client errors), show specific message
    if (error.status >= 400 && error.status < 500) {
      return `Failed to ${action}: ${error.message}`;
    }
  }

  // For 5xx errors or unknown errors, show generic message
  return `Failed to ${action}`;
}
