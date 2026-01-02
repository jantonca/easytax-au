import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ProviderDto } from '@/lib/api-client';
import { getProviders } from '@/lib/api-client';

export function useProviders(): UseQueryResult<ProviderDto[]> {
  return useQuery<ProviderDto[]>({
    queryKey: ['providers'],
    queryFn: getProviders,
  });
}
