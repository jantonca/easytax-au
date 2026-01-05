import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type IncomeResponseDto } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';

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
  const { showToast } = useToast();

  return useMutation<unknown, unknown, CreateIncomeVariables>({
    mutationFn: async ({ data }) => apiClient.post('/incomes', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
      showToast({ title: 'Income created successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'create income');
      showToast({ title: errorMessage });
    },
  });
}

export function useUpdateIncome(): UseMutationResult<
  IncomeResponseDto,
  unknown,
  UpdateIncomeVariables
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<IncomeResponseDto, unknown, UpdateIncomeVariables>({
    mutationFn: async ({ id, data }): Promise<IncomeResponseDto> =>
      apiClient.patch<IncomeResponseDto>(`/incomes/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
      showToast({ title: 'Income updated successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'update income');
      showToast({ title: errorMessage });
    },
  });
}

export function useDeleteIncome(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/incomes/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
      showToast({ title: 'Income deleted successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'delete income');
      showToast({ title: errorMessage });
    },
  });
}

export function useMarkPaid(): UseMutationResult<IncomeResponseDto, unknown, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<IncomeResponseDto, unknown, string>({
    mutationFn: async (id: string): Promise<IncomeResponseDto> =>
      apiClient.patch<IncomeResponseDto>(`/incomes/${id}/paid`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
      showToast({ title: 'Income marked as paid' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'mark income as paid');
      showToast({ title: errorMessage });
    },
  });
}

export function useMarkUnpaid(): UseMutationResult<IncomeResponseDto, unknown, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<IncomeResponseDto, unknown, string>({
    mutationFn: async (id: string): Promise<IncomeResponseDto> =>
      apiClient.patch<IncomeResponseDto>(`/incomes/${id}/unpaid`, {}),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
      showToast({ title: 'Income marked as unpaid' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'mark income as unpaid');
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
