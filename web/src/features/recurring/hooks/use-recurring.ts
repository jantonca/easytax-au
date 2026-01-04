import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  getRecurringExpenses,
  getDueRecurringExpenses,
  type RecurringExpenseResponseDto,
} from '@/lib/api-client';

export function useRecurringExpenses(): UseQueryResult<RecurringExpenseResponseDto[]> {
  return useQuery<RecurringExpenseResponseDto[]>({
    queryKey: ['recurring-expenses'],
    queryFn: getRecurringExpenses,
  });
}

export function useDueRecurringExpenses(
  asOfDate?: string,
): UseQueryResult<RecurringExpenseResponseDto[]> {
  return useQuery<RecurringExpenseResponseDto[]>({
    queryKey: ['recurring-expenses', 'due', asOfDate ?? 'today'],
    queryFn: () => getDueRecurringExpenses(asOfDate),
  });
}
