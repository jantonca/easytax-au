import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { IncomeResponseDto } from '@/lib/api-client';
import { getIncomes } from '@/lib/api-client';

export function useIncomes(): UseQueryResult<IncomeResponseDto[]> {
  return useQuery<IncomeResponseDto[]>({
    queryKey: ['incomes'],
    queryFn: getIncomes,
  });
}
