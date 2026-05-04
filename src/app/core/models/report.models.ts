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

/* ─── Category Analysis Report ───────────────────────────────────────────── */

export interface CategoryAnalysisItemResponse {
  categoryId: string | null;
  categoryName: string;
  categoryColor: string | null;
  categoryIcon: string | null;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

export interface CategoryAnalysisReportResponse {
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalTransactions: number;
  items: CategoryAnalysisItemResponse[];
}

/* ─── Payment Status Report ──────────────────────────────────────────────── */

export interface PaymentStatusGroupResponse {
  count: number;
  totalAmount: number;
}

export interface PaymentStatusReportResponse {
  reportDate: string;
  startDate: string;
  endDate: string;
  confirmed: PaymentStatusGroupResponse;
  pending: PaymentStatusGroupResponse;
  overdue: PaymentStatusGroupResponse;
  dueToday: PaymentStatusGroupResponse;
  dueNext7Days: PaymentStatusGroupResponse;
  withoutDueDate: PaymentStatusGroupResponse;
}
