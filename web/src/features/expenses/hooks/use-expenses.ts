import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ExpenseResponseDto } from '@/lib/api-client';
import { getExpenses } from '@/lib/api-client';

export function useExpenses(): UseQueryResult<ExpenseResponseDto[]> {
  return useQuery<ExpenseResponseDto[]>({
    queryKey: ['expenses'],
    queryFn: getExpenses,
  });
}
