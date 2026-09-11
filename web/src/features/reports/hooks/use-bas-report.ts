import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { BasSummaryDto, AccountingBasis } from '@/lib/api-client';
import { getBasSummary } from '@/lib/api-client';

export interface UseBasReportOptions {
  quarter: string;
  financialYear: number;
  basis?: AccountingBasis;
}

export function useBasReport({
  quarter,
  financialYear,
  basis = 'ACCRUAL',
}: UseBasReportOptions): UseQueryResult<BasSummaryDto, Error> {
  return useQuery<BasSummaryDto, Error>({
    queryKey: ['bas-report', quarter, financialYear, basis],
    queryFn: () => getBasSummary(quarter, financialYear, basis),
  });
}
