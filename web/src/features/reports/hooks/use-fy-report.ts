import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { FYSummaryDto } from '@/lib/api-client';
import { getFYSummary } from '@/lib/api-client';

export interface UseFYReportOptions {
  financialYear: number;
}

export function useFYReport({
  financialYear,
}: UseFYReportOptions): UseQueryResult<FYSummaryDto, Error> {
  return useQuery<FYSummaryDto, Error>({
    queryKey: ['fy-report', financialYear],
    queryFn: () => getFYSummary(financialYear),
  });
}
