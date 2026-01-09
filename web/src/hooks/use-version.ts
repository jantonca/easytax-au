import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { VersionResponse } from '@/lib/api-client';
import { getVersion } from '@/lib/api-client';

export function useVersion(): UseQueryResult<VersionResponse> {
  return useQuery<VersionResponse>({
    queryKey: ['version'],
    queryFn: getVersion,
    // Cache for 1 hour - version doesn't change during runtime
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60,
  });
}
