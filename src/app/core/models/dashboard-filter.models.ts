import { PaymentMethod, TransactionType } from './transaction.models';

export type DashboardFilterPreset =
  | 'thisMonth'
  | 'lastMonth'
  | 'last3Months'
  | 'last6Months'
  | 'thisYear'
  | 'custom';

export type DashboardStatusFilter = 'all' | 'confirmed' | 'pending';
export type DashboardTypeFilter = 'all' | 'income' | 'expense';

export interface DashboardDateRange {
  startDate: string;
  endDate: string;
}

export interface DashboardFilter {
  preset: DashboardFilterPreset;
  dateRange: DashboardDateRange;
  status: DashboardStatusFilter;
  type: DashboardTypeFilter;
  categoryId: string | null;
  familyGroupId: string | null;
  paymentMethod: PaymentMethod | null;
}

export interface DashboardFilterRequest {
  startDate: string;
  endDate: string;
  status?: DashboardStatusFilter;
  type?: DashboardTypeFilter;
  categoryId?: string | null;
  familyGroupId?: string | null;
  paymentMethod?: PaymentMethod | null;
}

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

export function calculateDateRange(preset: DashboardFilterPreset, customStart?: string, customEnd?: string): DashboardDateRange {
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  const startOfMonth = (year: number, month: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-01`;
  };

  const endOfMonth = (year: number, month: number): string => {
    const lastDay = new Date(year, month + 1, 0).getDate();
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  };

  const toStr = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  switch (preset) {
    case 'thisMonth':
      return { startDate: startOfMonth(y, m), endDate: toStr(today) };
    case 'lastMonth': {
      const lm = m === 0 ? 11 : m - 1;
      const ly = m === 0 ? y - 1 : y;
      return { startDate: startOfMonth(ly, lm), endDate: endOfMonth(ly, lm) };
    }
    case 'last3Months': {
      const start = new Date(y, m - 2, 1);
      return { startDate: toStr(start), endDate: toStr(today) };
    }
    case 'last6Months': {
      const start = new Date(y, m - 5, 1);
      return { startDate: toStr(start), endDate: toStr(today) };
    }
    case 'thisYear': {
      return { startDate: `${y}-01-01`, endDate: toStr(today) };
    }
    case 'custom':
      return { startDate: customStart ?? toStr(today), endDate: customEnd ?? toStr(today) };
    default:
      return { startDate: startOfMonth(y, m), endDate: toStr(today) };
  }
}
