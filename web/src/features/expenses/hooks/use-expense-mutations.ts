import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type ExpenseResponseDto } from '@/lib/api-client';

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

  return useMutation<unknown, unknown, CreateExpenseVariables>({
    mutationFn: async ({ data }) => apiClient.post('/expenses', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useUpdateExpense(): UseMutationResult<
  ExpenseResponseDto,
  unknown,
  UpdateExpenseVariables
> {
  const queryClient = useQueryClient();

  return useMutation<ExpenseResponseDto, unknown, UpdateExpenseVariables>({
    mutationFn: async ({ id, data }): Promise<ExpenseResponseDto> =>
      apiClient.patch<ExpenseResponseDto>(`/expenses/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

export function useDeleteExpense(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/expenses/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}
