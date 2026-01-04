import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { QuarterDateRange } from '@/lib/api-client';
import { getQuartersForYear } from '@/lib/api-client';

export function useAvailableQuarters(year: number): UseQueryResult<QuarterDateRange[], Error> {
  return useQuery<QuarterDateRange[], Error>({
    queryKey: ['quarters', year],
    queryFn: () => getQuartersForYear(year),
  });
}
