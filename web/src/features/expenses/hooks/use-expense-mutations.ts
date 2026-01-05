import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type ExpenseResponseDto } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';

type CreateExpenseDto = components['schemas']['CreateExpenseDto'];

interface CreateExpenseVariables {
  data: CreateExpenseDto;
}

interface UpdateExpenseVariables {
  id: string;
  data: Partial<CreateExpenseDto>;
}

export function useCreateExpense(): UseMutationResult<unknown, unknown, CreateExpenseVariables> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<unknown, unknown, CreateExpenseVariables>({
    mutationFn: async ({ data }) => apiClient.post('/expenses', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast({ title: 'Expense created successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'create expense');
      showToast({ title: errorMessage });
    },
  });
}

export function useUpdateExpense(): UseMutationResult<
  ExpenseResponseDto,
  unknown,
  UpdateExpenseVariables
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<ExpenseResponseDto, unknown, UpdateExpenseVariables>({
    mutationFn: async ({ id, data }): Promise<ExpenseResponseDto> =>
      apiClient.patch<ExpenseResponseDto>(`/expenses/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast({ title: 'Expense updated successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'update expense');
      showToast({ title: errorMessage });
    },
  });
}

export function useDeleteExpense(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/expenses/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
      showToast({ title: 'Expense deleted successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'delete expense');
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
