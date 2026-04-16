export enum TransactionType {
  Income = 0,
  Expense = 1,
}

export enum RecurrenceType {
  None = 0,
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
  Yearly = 4,
}

export enum PaymentMethod {
  Pix = 0,
  CreditCard = 1,
  DebitCard = 2,
  Cash = 3,
  Ted = 4,
  Boleto = 5,
  Other = 6,
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
  categoryId: string | null;
  notes: string | null;
  recurrenceType: RecurrenceType;
  recurrenceEndDate: string | null;
  isConfirmed: boolean;
  paymentMethod: PaymentMethod | null;
  familyGroupId: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TagSummary[];
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
  familyGroupId: null;
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
  familyGroupId: null;
}

export interface GetTransactionsParams {
  pageNumber?: number;
  pageSize?: number;
  type?: TransactionType | null;
  categoryId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isConfirmed?: boolean | null;
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
