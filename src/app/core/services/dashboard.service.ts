import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TransactionService } from './transaction.service';
import { MonthlyTransactionSummary, TransactionResponse, TransactionSummaryResponse, TransactionType } from '../models/transaction.models';
import { CategoryExpense, DashboardData, MonthlyPoint, DashboardFilterRequest, calculateDateRange } from '../models';
import { DashboardOverviewResponse } from '../models/dashboard-overview.models';
import { environment } from '../../../environments/environment';

const PALETTE = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];

function buildFilterParams(filters: DashboardFilterRequest): HttpParams {
  let params = new HttpParams()
    .set('startDate', filters.startDate)
    .set('endDate', filters.endDate);

  if (filters.type && filters.type !== 'all') {
    params = params.set('type', filters.type === 'income' ? 'Income' : 'Expense');
  }
  if (filters.status && filters.status !== 'all') {
    params = params.set('isConfirmed', filters.status === 'confirmed' ? 'true' : 'false');
  }
  if (filters.categoryId) {
    params = params.set('categoryId', filters.categoryId);
  }
  if (filters.familyGroupId) {
    params = params.set('familyGroupId', filters.familyGroupId);
  }
  if (filters.paymentMethod) {
    params = params.set('paymentMethod', filters.paymentMethod);
  }

  return params;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly transactionService = inject(TransactionService);
  private readonly base = `${environment.apiUrl}/dashboard`;

  /** Endpoint /dashboard/overview com suporte a filtros avançados */
  getOverview(filters: DashboardFilterRequest): Observable<DashboardOverviewResponse> {
    const params = buildFilterParams(filters);
    return this.http.get<DashboardOverviewResponse>(`${this.base}/overview`, { params });
  }

  /** Carrega dados do dashboard a partir de filtros avançados */
  load(filters: DashboardFilterRequest): Observable<DashboardData> {
    const { startDate, endDate } = filters;

    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth() - 1, 1);
    const prevEndStr = this.toDateString(prevEnd);
    const prevStartStr = this.toDateString(prevStart);

    const commonParams = this.toTransactionParams(filters);
    const prevParams = { ...commonParams, startDate: prevStartStr, endDate: prevEndStr };

    return forkJoin({
      summary: this.transactionService.getSummary(commonParams),
      prevSummary: this.transactionService.getSummary(prevParams).pipe(
        catchError(() => of(null as TransactionSummaryResponse | null)),
      ),
      monthly: this.transactionService.getMonthlySummary(commonParams),
      expenses: this.transactionService.getAll({
        ...commonParams,
        type: TransactionType.Expense,
        pageSize: 500,
      }),
      recent: this.transactionService.getAll({ ...commonParams, pageSize: 5, pageNumber: 1 }),
    }).pipe(
      map(({ summary, prevSummary, monthly, expenses, recent }) => ({
        summary,
        prevSummary,
        monthlyEvolution: this.buildMonthlyEvolution(monthly, startDate, endDate),
        topCategories: this.buildTopCategories(expenses.items),
        recentTransactions: recent.items,
      }))
    );
  }

  private toTransactionParams(filters: DashboardFilterRequest): import('../models/transaction.models').GetTransactionsParams {
    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
      type: filters.type && filters.type !== 'all' ? (filters.type === 'income' ? TransactionType.Income : TransactionType.Expense) : null,
      categoryId: filters.categoryId,
      familyGroupId: filters.familyGroupId,
      paymentMethod: filters.paymentMethod,
      isConfirmed: filters.status === 'confirmed' ? true : filters.status === 'pending' ? false : null,
    };
  }

  private buildMonthlyEvolution(data: MonthlyTransactionSummary[], startDate: string, endDate: string): MonthlyPoint[] {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
    const dataMap = new Map(data.map(d => [d.month, d]));

    return Array.from({ length: Math.min(months, 12) }, (_, i) => {
      const date = new Date(start.getFullYear(), start.getMonth() + i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const entry = dataMap.get(key);

      return {
        label: date.toLocaleDateString('pt-BR', {
          month: 'short',
          ...(months > 1 && { year: '2-digit' }),
        }),
        income: entry?.income ?? 0,
        expense: entry?.expense ?? 0,
      };
    });
  }

  private buildTopCategories(expenses: TransactionResponse[]): CategoryExpense[] {
    const total = expenses.reduce((s, t) => s + t.amount, 0);

    const grouped = new Map<string | null, { amount: number; name: string; color: string | null }>();
    for (const t of expenses) {
      const key = t.categoryId;
      const existing = grouped.get(key);
      if (existing) {
        existing.amount += t.amount;
      } else {
        grouped.set(key, { amount: t.amount, name: t.categoryName ?? '—', color: t.categoryColor });
      }
    }

    return [...grouped.entries()]
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 8)
      .map(([catId, { amount, name, color }], i) => ({
        categoryId: catId,
        categoryName: name,
        color: color ?? PALETTE[i % PALETTE.length],
        total: amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }));
  }

  private toDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
