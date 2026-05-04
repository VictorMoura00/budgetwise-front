export enum TransactionType {
  Income = 'Income',
  Expense = 'Expense',
}

export enum RecurrenceType {
  None = 'None',
  Daily = 'Daily',
  Weekly = 'Weekly',
  Monthly = 'Monthly',
  Yearly = 'Yearly',
}

export enum PaymentMethod {
  Pix = 'Pix',
  CreditCard = 'CreditCard',
  DebitCard = 'DebitCard',
  Cash = 'Cash',
  Ted = 'Ted',
  Boleto = 'Boleto',
  Other = 'Other',
}

export interface TagSummary {
  id: string;
  name: string;
}

export interface TransactionResponse {
  id: string;
  userId: string;
  description: string;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  dueDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  notes: string | null;
  recurrenceType: RecurrenceType;
  recurrenceEndDate: string | null;
  isConfirmed: boolean;
  paidAt: string | null;
  paymentMethod: PaymentMethod | null;
  familyGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagSummary[];
}

export interface TransactionSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingCount: number;
  pendingAmount: number;
}

export interface MonthlyTransactionSummary {
  month: string;  // "YYYY-MM"
  income: number;
  expense: number;
}

export interface CreateTransactionRequest {
  description: string;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  categoryId: string | null;
  notes: string | null;
  recurrenceType: RecurrenceType;
  recurrenceEndDate: string | null;
  isConfirmed: boolean;
  paymentMethod: PaymentMethod | null;
  familyGroupId: string | null;
  dueDate: string | null;
}

export interface UpdateTransactionRequest {
  description: string;
  amount: number;
  type: TransactionType;
  transactionDate: string;
  categoryId: string | null;
  notes: string | null;
  recurrenceType: RecurrenceType;
  recurrenceEndDate: string | null;
  paymentMethod: PaymentMethod | null;
  familyGroupId: string | null;
  dueDate: string | null;
}

export interface ConfirmTransactionRequest {
  paidAt: string | null;
}

export interface GetTransactionsParams {
  pageNumber?: number;
  pageSize?: number;
  type?: TransactionType | null;
  categoryId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isConfirmed?: boolean | null;
  dueDate?: string | null;
  familyGroupId?: string | null;
  paymentMethod?: PaymentMethod | null;
}

export interface PaginatedTransactionResponse {
  items: TransactionResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
