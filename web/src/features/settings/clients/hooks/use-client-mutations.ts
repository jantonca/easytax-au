import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type ClientDto } from '@/lib/api-client';

type CreateClientDto = components['schemas']['CreateClientDto'];

interface CreateClientVariables {
  data: CreateClientDto;
}

interface UpdateClientVariables {
  id: string;
  data: Partial<CreateClientDto>;
}

export function useCreateClient(): UseMutationResult<ClientDto, unknown, CreateClientVariables> {
  const queryClient = useQueryClient();

  return useMutation<ClientDto, unknown, CreateClientVariables>({
    mutationFn: async ({ data }): Promise<ClientDto> => apiClient.post<ClientDto>('/clients', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient(): UseMutationResult<ClientDto, unknown, UpdateClientVariables> {
  const queryClient = useQueryClient();

  return useMutation<ClientDto, unknown, UpdateClientVariables>({
    mutationFn: async ({ id, data }): Promise<ClientDto> =>
      apiClient.patch<ClientDto>(`/clients/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/clients/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Also invalidate incomes since they contain client info
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });
    },
  });
}
