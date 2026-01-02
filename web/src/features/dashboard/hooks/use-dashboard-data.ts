import { useQuery } from '@tanstack/react-query';
import type {
  BasSummaryDto,
  ExpenseResponseDto,
  RecurringExpenseResponseDto,
} from '@/lib/api-client';
import { getBasSummary, getDueRecurringExpenses, getRecentExpenses } from '@/lib/api-client';
import { getFYInfo } from '@/lib/fy';

export interface DashboardData {
  bas?: BasSummaryDto;
  basLoading: boolean;
  basError: unknown;
  recentExpenses?: ExpenseResponseDto[];
  recentExpensesLoading: boolean;
  recentExpensesError: unknown;
  dueRecurring?: RecurringExpenseResponseDto[];
  dueRecurringLoading: boolean;
  dueRecurringError: unknown;
}

export function useDashboardData(date: Date = new Date()): DashboardData {
  const fyInfo = getFYInfo(date);

  const {
    data: bas,
    isLoading: basLoading,
    error: basError,
  } = useQuery<BasSummaryDto>({
    queryKey: ['bas', fyInfo.quarter, fyInfo.financialYear],
    queryFn: () => getBasSummary(fyInfo.quarter, fyInfo.financialYear),
  });

  const {
    data: recentExpenses,
    isLoading: recentExpensesLoading,
    error: recentExpensesError,
  } = useQuery<ExpenseResponseDto[]>({
    queryKey: ['dashboard', 'recent-expenses'],
    queryFn: async () => {
      const all = await getRecentExpenses();

      return all
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);
    },
  });

  const {
    data: dueRecurring,
    isLoading: dueRecurringLoading,
    error: dueRecurringError,
  } = useQuery<RecurringExpenseResponseDto[]>({
    queryKey: ['dashboard', 'due-recurring-expenses'],
    queryFn: () => getDueRecurringExpenses(),
  });

  return {
    bas,
    basLoading,
    basError,
    recentExpenses,
    recentExpensesLoading,
    recentExpensesError,
    dueRecurring,
    dueRecurringLoading,
    dueRecurringError,
  };
}
