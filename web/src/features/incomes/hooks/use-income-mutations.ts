import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type IncomeResponseDto } from '@/lib/api-client';

type CreateIncomeDto = components['schemas']['CreateIncomeDto'];

interface CreateIncomeVariables {
  data: CreateIncomeDto;
}

interface UpdateIncomeVariables {
  id: string;
  data: Partial<CreateIncomeDto>;
}

export function useCreateIncome(): UseMutationResult<unknown, unknown, CreateIncomeVariables> {
  const queryClient = useQueryClient();

  return useMutation<unknown, unknown, CreateIncomeVariables>({
    mutationFn: async ({ data }) => apiClient.post('/incomes', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}

export function useUpdateIncome(): UseMutationResult<
  IncomeResponseDto,
  unknown,
  UpdateIncomeVariables
> {
  const queryClient = useQueryClient();

  return useMutation<IncomeResponseDto, unknown, UpdateIncomeVariables>({
    mutationFn: async ({ id, data }): Promise<IncomeResponseDto> =>
      apiClient.patch<IncomeResponseDto>(`/incomes/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}

export function useDeleteIncome(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/incomes/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}

export function useMarkPaid(): UseMutationResult<IncomeResponseDto, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation<IncomeResponseDto, unknown, string>({
    mutationFn: async (id: string): Promise<IncomeResponseDto> =>
      apiClient.patch<IncomeResponseDto>(`/incomes/${id}/paid`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}

export function useMarkUnpaid(): UseMutationResult<IncomeResponseDto, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation<IncomeResponseDto, unknown, string>({
    mutationFn: async (id: string): Promise<IncomeResponseDto> =>
      apiClient.patch<IncomeResponseDto>(`/incomes/${id}/unpaid`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}
