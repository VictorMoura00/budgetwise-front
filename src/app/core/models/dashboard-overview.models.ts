export interface DashboardPeriod {
  year: number;
  month: number;
  startDate: string;
  endDate: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savingsRate: number | null;
  confirmedBalance: number;
  pendingImpact: number;
  projectedBalance: number;
}

export interface PendingSummary {
  totalPendingCount: number;
  totalPendingAmount: number;
  overdue: { count: number; totalAmount: number };
  dueToday: { count: number; totalAmount: number };
  dueNext7Days: { count: number; totalAmount: number };
  dueNext30Days: { count: number; totalAmount: number };
  future: { count: number; totalAmount: number };
  withoutDueDate: { count: number; totalAmount: number };
}

export interface CategoryHighlightItem {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  amount: number;
  changePercent: number | null;
}

export interface CategoryHighlights {
  totalExpenseCategories: number;
  topExpenseCategory: CategoryHighlightItem | null;
  topIncomeCategory: CategoryHighlightItem | null;
  fastestGrowingCategory: CategoryHighlightItem | null;
}

export interface LargestExpense {
  id: string;
  description: string;
  amount: number;
  categoryName: string | null;
  categoryColor: string | null;
  transactionDate: string;
  dueDate: string | null;
}

export interface MonthlyComparison {
  previousIncome: number;
  previousExpense: number;
  incomeDiff: number;
  incomeDiffPercent: number | null;
  expenseDiff: number;
  expenseDiffPercent: number | null;
}

export interface DashboardOverviewResponse {
  period: DashboardPeriod;
  financialSummary: FinancialSummary;
  pendingSummary: PendingSummary;
  categoryHighlights: CategoryHighlights;
  largestExpense: LargestExpense | null;
  monthlyComparison: MonthlyComparison;
}
