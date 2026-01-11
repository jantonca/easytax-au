import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type CategoryDto } from '@/lib/api-client';
import { useToast } from '@/lib/toast-context';

type CreateCategoryDto = components['schemas']['CreateCategoryDto'];

interface CreateCategoryVariables {
  data: CreateCategoryDto;
}

interface UpdateCategoryVariables {
  id: string;
  data: Partial<CreateCategoryDto>;
}

export function useCreateCategory(): UseMutationResult<
  CategoryDto,
  unknown,
  CreateCategoryVariables
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<CategoryDto, unknown, CreateCategoryVariables>({
    mutationFn: async ({ data }): Promise<CategoryDto> =>
      apiClient.post<CategoryDto>('/categories', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast({ title: 'Category created successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'create category');
      showToast({ title: errorMessage });
    },
  });
}

export function useUpdateCategory(): UseMutationResult<
  CategoryDto,
  unknown,
  UpdateCategoryVariables
> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<CategoryDto, unknown, UpdateCategoryVariables>({
    mutationFn: async ({ id, data }): Promise<CategoryDto> =>
      apiClient.patch<CategoryDto>(`/categories/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      showToast({ title: 'Category updated successfully' });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'update category');
      showToast({ title: errorMessage });
    },
  });
}

export function useDeleteCategory(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/categories/${id}`),
    onSuccess: async (_, deletedId) => {
      // Get the deleted category from cache before invalidation
      const categories = queryClient.getQueryData<CategoryDto[]>(['categories']);
      const deletedCategory = categories?.find((c) => c.id === deletedId);

      await queryClient.invalidateQueries({ queryKey: ['categories'] });

      if (!deletedCategory) {
        showToast({ title: 'Category deleted', variant: 'success' });
        return;
      }

      // Show undo toast with 8-second window
      showToast({
        title: 'Category deleted',
        description: deletedCategory.name || undefined,
        variant: 'success',
        duration: 8000,
        action: {
          label: 'Undo',
          onClick: () => {
            // Recreate the category by calling the create API
            const restoreData: {
              name: string;
              basLabel: string;
              isDeductible: boolean;
              description?: string;
            } = {
              name: deletedCategory.name,
              basLabel: deletedCategory.basLabel,
              isDeductible: deletedCategory.isDeductible,
            };

            // Only include optional fields if they have values
            if (deletedCategory.description) {
              restoreData.description = deletedCategory.description;
            }

            apiClient
              .post('/categories', restoreData)
              .then(() => {
                void queryClient.invalidateQueries({ queryKey: ['categories'] });
                showToast({
                  title: 'Category restored',
                  variant: 'success',
                  duration: 3000,
                });
              })
              .catch(() => {
                showToast({
                  title: 'Failed to restore category',
                  variant: 'error',
                  duration: 5000,
                });
              });
          },
        },
      });
    },
    onError: (error: unknown) => {
      const errorMessage = getErrorMessage(error, 'delete category');
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
