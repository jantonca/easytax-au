import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type ClientDto } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';

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
  const { showToast } = useToast();

  return useMutation<ClientDto, unknown, CreateClientVariables>({
    mutationFn: async ({ data }): Promise<ClientDto> => apiClient.post<ClientDto>('/clients', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      showToast({ title: 'Client created successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'create client');
      showToast({ title: errorMessage });
    },
  });
}

export function useUpdateClient(): UseMutationResult<ClientDto, unknown, UpdateClientVariables> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<ClientDto, unknown, UpdateClientVariables>({
    mutationFn: async ({ id, data }): Promise<ClientDto> =>
      apiClient.patch<ClientDto>(`/clients/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      showToast({ title: 'Client updated successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'update client');
      showToast({ title: errorMessage });
    },
  });
}

export function useDeleteClient(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/clients/${id}`),
    onSuccess: async (_, deletedId) => {
      // Get the deleted client from cache before invalidation
      const clients = queryClient.getQueryData<ClientDto[]>(['clients']);
      const deletedClient = clients?.find((c) => c.id === deletedId);

      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      // Also invalidate incomes since they contain client info
      await queryClient.invalidateQueries({ queryKey: ['incomes'] });

      if (!deletedClient) {
        showToast({ title: 'Client deleted', variant: 'success' });
        return;
      }

      // Show undo toast with 8-second window
      showToast({
        title: 'Client deleted',
        description: deletedClient.name || undefined,
        variant: 'success',
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () => {
            // Recreate the client by calling the create API
            const restoreData: {
              name: string;
              isPsiEligible: boolean;
              abn?: string;
            } = {
              name: deletedClient.name,
              isPsiEligible: deletedClient.isPsiEligible,
            };

            // Only include optional fields if they have values
            if (deletedClient.abn) {
              restoreData.abn = deletedClient.abn;
            }

            apiClient
              .post('/clients', restoreData)
              .then(() => {
                void queryClient.invalidateQueries({ queryKey: ['clients'] });
                void queryClient.invalidateQueries({ queryKey: ['incomes'] });
                showToast({
                  title: 'Client restored',
                  variant: 'success',
                  duration: 3000,
                });
              })
              .catch(() => {
                showToast({
                  title: 'Failed to restore client',
                  variant: 'error',
                  duration: 5000,
                });
              });
          },
        },
      });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'delete client');
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
