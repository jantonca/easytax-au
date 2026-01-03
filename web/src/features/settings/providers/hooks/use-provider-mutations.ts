import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type ProviderDto } from '@/lib/api-client';

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

  return useMutation<ProviderDto, unknown, CreateProviderVariables>({
    mutationFn: async ({ data }): Promise<ProviderDto> =>
      apiClient.post<ProviderDto>('/providers', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}

export function useUpdateProvider(): UseMutationResult<
  ProviderDto,
  unknown,
  UpdateProviderVariables
> {
  const queryClient = useQueryClient();

  return useMutation<ProviderDto, unknown, UpdateProviderVariables>({
    mutationFn: async ({ id, data }): Promise<ProviderDto> =>
      apiClient.patch<ProviderDto>(`/providers/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}

export function useDeleteProvider(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/providers/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['providers'] });
    },
  });
}
