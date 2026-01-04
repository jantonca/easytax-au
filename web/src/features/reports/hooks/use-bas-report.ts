import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { BasSummaryDto } from '@/lib/api-client';
import { getBasSummary } from '@/lib/api-client';

export interface UseBasReportOptions {
  quarter: string;
  financialYear: number;
}

export function useBasReport({
  quarter,
  financialYear,
}: UseBasReportOptions): UseQueryResult<BasSummaryDto, Error> {
  return useQuery<BasSummaryDto, Error>({
    queryKey: ['bas-report', quarter, financialYear],
    queryFn: () => getBasSummary(quarter, financialYear),
  });
}
