import { TransactionResponse, TransactionSummaryResponse } from './transaction.models';
import { MonthlyPoint, CategoryExpense } from './dashboard-filter.models';

export type PeriodMonths = 1 | 3 | 6;

export type { MonthlyPoint, CategoryExpense };

export interface DashboardData {
  summary: TransactionSummaryResponse;
  prevSummary: TransactionSummaryResponse | null;
  monthlyEvolution: MonthlyPoint[];
  topCategories: CategoryExpense[];
  recentTransactions: TransactionResponse[];
}
