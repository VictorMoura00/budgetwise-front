import { TransactionType } from './transaction.models';

export interface DueTransactionItem {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  dueDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
}

export interface DueTransactionGroup {
  count: number;
  totalAmount: number;
  items: DueTransactionItem[];
}

export interface DueTransactionsReportResponse {
  reportDate: string;
  totalPendingCount: number;
  totalPendingAmount: number;
  overdue: DueTransactionGroup;
  dueToday: DueTransactionGroup;
  dueNext7Days: DueTransactionGroup;
  dueNext30Days: DueTransactionGroup;
  future: DueTransactionGroup;
  withoutDueDate: DueTransactionGroup;
}
