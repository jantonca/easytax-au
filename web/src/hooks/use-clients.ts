import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ClientDto } from '@/lib/api-client';
import { getClients } from '@/lib/api-client';

export function useClients(): UseQueryResult<ClientDto[]> {
  return useQuery<ClientDto[]>({
    queryKey: ['clients'],
    queryFn: getClients,
  });
}
