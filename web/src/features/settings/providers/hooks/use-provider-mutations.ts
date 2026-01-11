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
    onSuccess: async (_, deletedId) => {
      // Get the deleted provider from cache before invalidation
      const providers = queryClient.getQueryData<ProviderDto[]>(['providers']);
      const deletedProvider = providers?.find((p) => p.id === deletedId);

      await queryClient.invalidateQueries({ queryKey: ['providers'] });

      if (!deletedProvider) {
        showToast({ title: 'Provider deleted', variant: 'success' });
        return;
      }

      // Show undo toast with 8-second window
      showToast({
        title: 'Provider deleted',
        description: deletedProvider.name || undefined,
        variant: 'success',
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () => {
            // Recreate the provider by calling the create API
            const restoreData: {
              name: string;
              isInternational: boolean;
              defaultCategoryId?: string;
              abnArn?: string;
            } = {
              name: deletedProvider.name,
              isInternational: deletedProvider.isInternational,
            };

            // Only include optional fields if they have values
            if (deletedProvider.defaultCategoryId) {
              restoreData.defaultCategoryId = deletedProvider.defaultCategoryId;
            }
            if (deletedProvider.abnArn) {
              restoreData.abnArn = deletedProvider.abnArn;
            }

            apiClient
              .post('/providers', restoreData)
              .then(() => {
                void queryClient.invalidateQueries({ queryKey: ['providers'] });
                showToast({
                  title: 'Provider restored',
                  variant: 'success',
                  duration: 3000,
                });
              })
              .catch(() => {
                showToast({
                  title: 'Failed to restore provider',
                  variant: 'error',
                  duration: 5000,
                });
              });
          },
        },
      });
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
