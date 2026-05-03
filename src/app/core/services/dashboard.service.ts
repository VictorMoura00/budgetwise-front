import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TransactionService } from './transaction.service';
import { MonthlyTransactionSummary, TransactionResponse, TransactionSummaryResponse, TransactionType } from '../models/transaction.models';
import { CategoryExpense, DashboardData, MonthlyPoint, PeriodMonths } from '../models/dashboard.models';
import { DashboardOverviewResponse } from '../models/dashboard-overview.models';
import { environment } from '../../../environments/environment';

const PALETTE = [
  '#6366f1', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6',
];

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly transactionService = inject(TransactionService);
  private readonly base = `${environment.apiUrl}/dashboard`;

  /** Novo endpoint unificado /dashboard/overview */
  getOverview(year: number, month: number): Observable<DashboardOverviewResponse> {
    const params = new HttpParams()
      .set('year', year)
      .set('month', month);
    return this.http.get<DashboardOverviewResponse>(`${this.base}/overview`, { params });
  }

  /** Legado: composição de múltiplos endpoints (mantido para compatibilidade durante transição) */
  load(months: PeriodMonths): Observable<DashboardData> {
    const today = new Date();
    const endDate = this.toDateString(today);
    const startDate = this.toDateString(new Date(today.getFullYear(), today.getMonth() - (months - 1), 1));

    const prevEnd = new Date(today.getFullYear(), today.getMonth() - (months - 1), 0);
    const prevStart = this.toDateString(new Date(prevEnd.getFullYear(), prevEnd.getMonth() - (months - 1), 1));
    const prevEndStr = this.toDateString(prevEnd);

    return forkJoin({
      summary: this.transactionService.getSummary({ startDate, endDate }),
      prevSummary: this.transactionService.getSummary({ startDate: prevStart, endDate: prevEndStr }).pipe(
        catchError(() => of(null as TransactionSummaryResponse | null)),
      ),
      monthly: this.transactionService.getMonthlySummary(months),
      expenses: this.transactionService.getAll({
        type: TransactionType.Expense,
        startDate,
        endDate,
        pageSize: 500,
      }),
      recent: this.transactionService.getAll({ pageSize: 5, pageNumber: 1 }),
    }).pipe(
      map(({ summary, prevSummary, monthly, expenses, recent }) => ({
        summary,
        prevSummary,
        monthlyEvolution: this.buildMonthlyEvolution(monthly, months),
        topCategories: this.buildTopCategories(expenses.items),
        recentTransactions: recent.items,
      }))
    );
  }

  private buildMonthlyEvolution(data: MonthlyTransactionSummary[], months: PeriodMonths): MonthlyPoint[] {
    const today = new Date();
    const dataMap = new Map(data.map(d => [d.month, d]));

    return Array.from({ length: months }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1);
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
