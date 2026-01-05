import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type ProviderDto } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';

type CreateProviderDto = components['schemas']['CreateProviderDto'];

interface CreateProviderVariables {
  data: CreateProviderDto;
}

interface UpdateProviderVariables {
  id: string;
  data: Partial<CreateProviderDto>;
}

export function useCreateProvider(): UseMutationResult<
  ProviderDto,
  unknown,
  CreateProviderVariables
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<ProviderDto, unknown, CreateProviderVariables>({
    mutationFn: async ({ data }): Promise<ProviderDto> =>
      apiClient.post<ProviderDto>('/providers', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] });
      showToast({ title: 'Provider created successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'create provider');
      showToast({ title: errorMessage });
    },
  });
}

export function useUpdateProvider(): UseMutationResult<
  ProviderDto,
  unknown,
  UpdateProviderVariables
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<ProviderDto, unknown, UpdateProviderVariables>({
    mutationFn: async ({ id, data }): Promise<ProviderDto> =>
      apiClient.patch<ProviderDto>(`/providers/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] });
      showToast({ title: 'Provider updated successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'update provider');
      showToast({ title: errorMessage });
    },
  });
}

export function useDeleteProvider(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/providers/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] });
      showToast({ title: 'Provider deleted successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'delete provider');
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
  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    'message' in error &&
    typeof error.status === 'number' &&
    typeof error.message === 'string'
  ) {
    if (error.status >= 400 && error.status < 500) {
      return `Failed to ${action}: ${error.message}`;
    }
  }
  return `Failed to ${action}`;
}
