import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { CategoryDto } from '@/lib/api-client';
import { getCategories } from '@/lib/api-client';

export function useCategories(): UseQueryResult<CategoryDto[]> {
  return useQuery<CategoryDto[]>({
    queryKey: ['categories'],
    queryFn: getCategories,
  });
}
