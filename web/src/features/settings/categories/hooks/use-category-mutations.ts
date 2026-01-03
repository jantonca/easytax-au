import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { components } from '@shared/types';
import { apiClient, type CategoryDto } from '@/lib/api-client';

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

  return useMutation<CategoryDto, unknown, CreateCategoryVariables>({
    mutationFn: async ({ data }): Promise<CategoryDto> =>
      apiClient.post<CategoryDto>('/categories', data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory(): UseMutationResult<
  CategoryDto,
  unknown,
  UpdateCategoryVariables
> {
  const queryClient = useQueryClient();

  return useMutation<CategoryDto, unknown, UpdateCategoryVariables>({
    mutationFn: async ({ id, data }): Promise<CategoryDto> =>
      apiClient.patch<CategoryDto>(`/categories/${id}`, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string>({
    mutationFn: async (id: string) => apiClient.delete<void>(`/categories/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
