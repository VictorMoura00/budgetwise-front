export interface ParticipantRequest {
  userId: string;
  amountOwed: number;
}

export interface CreateSharedExpenseRequest {
  description: string;
  totalAmount: number;
  expenseDate: string;
  categoryId: string | null;
  participants: ParticipantRequest[];
}

export interface ParticipantResponse {
  id: string;
  userId: string;
  amountOwed: number;
  isSettled: boolean;
  settledAt: string | null;
}

export interface SharedExpenseResponse {
  id: string;
  familyGroupId: string;
  transactionId: string;
  description: string | null;
  totalAmount: number;
  createdBy: string;
  totalSettled: number;
  totalPending: number;
  isFullySettled: boolean;
  createdAt: string;
  updatedAt: string;
  participants: ParticipantResponse[];
}

export interface ParticipantSummaryResponse {
  userId: string;
  userName: string;
  amountOwed: number;
  amountSettled: number;
  amountPending: number;
}

export interface SharedExpenseSummaryResponse {
  totalExpenses: number;
  totalAmount: number;
  totalSettled: number;
  totalPending: number;
  fullySettledCount: number;
  partiallySettledCount: number;
  unsettledCount: number;
  participantTotals: ParticipantSummaryResponse[];
}

export interface PaginatedSharedExpenseResponse {
  items: SharedExpenseResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
