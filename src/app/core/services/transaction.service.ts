import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateTransactionRequest,
  GetTransactionsParams,
  MonthlyTransactionSummary,
  PaginatedTransactionResponse,
  TransactionResponse,
  TransactionSummaryResponse,
  UpdateTransactionRequest,
} from '../models/transaction.models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/transactions`;

  getAll(params: GetTransactionsParams = {}): Observable<PaginatedTransactionResponse> {
    let httpParams = new HttpParams()
      .set('pageNumber', params.pageNumber ?? 1)
      .set('pageSize', params.pageSize ?? 20);

    if (params.type != null) httpParams = httpParams.set('type', params.type);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params.isConfirmed != null) httpParams = httpParams.set('isConfirmed', params.isConfirmed);

    return this.http.get<PaginatedTransactionResponse>(this.base, { params: httpParams });
  }

  getById(id: string): Observable<TransactionResponse> {
    return this.http.get<TransactionResponse>(`${this.base}/${id}`);
  }

  create(request: CreateTransactionRequest): Observable<TransactionResponse> {
    return this.http.post<TransactionResponse>(this.base, request);
  }

  update(id: string, request: UpdateTransactionRequest): Observable<TransactionResponse> {
    return this.http.put<TransactionResponse>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  confirm(id: string): Observable<TransactionResponse> {
    return this.http.patch<TransactionResponse>(`${this.base}/${id}/confirm`, {});
  }

  getSummary(params: { startDate?: string; endDate?: string } = {}): Observable<TransactionSummaryResponse> {
    let httpParams = new HttpParams();
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    return this.http.get<TransactionSummaryResponse>(`${this.base}/summary`, { params: httpParams });
  }

  getMonthlySummary(months: number): Observable<MonthlyTransactionSummary[]> {
    const httpParams = new HttpParams().set('months', months);
    return this.http.get<MonthlyTransactionSummary[]>(`${this.base}/monthly-summary`, { params: httpParams });
  }
}
