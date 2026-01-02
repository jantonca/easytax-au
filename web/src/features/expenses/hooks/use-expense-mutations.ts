import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { CreateExpenseDto } from '@shared/types';
import { apiClient } from '@/lib/api-client';

interface CreateExpenseVariables {
  data: CreateExpenseDto;
}

export function useCreateExpense(): UseMutationResult<unknown, unknown, CreateExpenseVariables> {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, CreateExpenseVariables>({
    mutationFn: async ({ data }) => apiClient.post('/expenses', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
