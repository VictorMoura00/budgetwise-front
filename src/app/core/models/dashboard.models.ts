import { TransactionResponse, TransactionSummaryResponse } from './transaction.models';

export type PeriodMonths = 1 | 3 | 6;

export interface MonthlyPoint {
  label: string;
  income: number;
  expense: number;
}

export interface CategoryExpense {
  categoryId: string | null;
  categoryName: string;
  color: string;
  total: number;
  percentage: number;
}

export interface DashboardData {
  summary: TransactionSummaryResponse;
  prevSummary: TransactionSummaryResponse | null;
  monthlyEvolution: MonthlyPoint[];
  topCategories: CategoryExpense[];
  recentTransactions: TransactionResponse[];
}
