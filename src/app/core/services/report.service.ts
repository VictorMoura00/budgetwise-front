import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CategoryAnalysisReportResponse,
  DueTransactionsReportResponse,
  PaymentStatusReportResponse,
} from '../models/report.models';
import { DashboardFilterRequest } from '../models/dashboard-filter.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reports`;

  getDueTransactions(includeItems = true): Observable<DueTransactionsReportResponse> {
    const params = new HttpParams().set('includeItems', includeItems);
    return this.http.get<DueTransactionsReportResponse>(`${this.base}/due-transactions`, { params });
  }

  getCategoryAnalysis(filters: DashboardFilterRequest): Observable<CategoryAnalysisReportResponse> {
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

    return this.http.get<CategoryAnalysisReportResponse>(`${this.base}/category-analysis`, { params });
  }

  getPaymentStatus(filters: DashboardFilterRequest): Observable<PaymentStatusReportResponse> {
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

    return this.http.get<PaymentStatusReportResponse>(`${this.base}/payment-status`, { params });
  }
}
