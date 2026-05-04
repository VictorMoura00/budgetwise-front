import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ConfirmTransactionRequest,
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
    if (params.dueDate) httpParams = httpParams.set('dueDate', params.dueDate);
    if (params.familyGroupId) httpParams = httpParams.set('familyGroupId', params.familyGroupId);
    if (params.paymentMethod) httpParams = httpParams.set('paymentMethod', params.paymentMethod);

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

  confirm(id: string, request: ConfirmTransactionRequest = { paidAt: null }): Observable<TransactionResponse> {
    return this.http.patch<TransactionResponse>(`${this.base}/${id}/confirm`, request);
  }

  addTag(transactionId: string, tagId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${transactionId}/tags/${tagId}`, {});
  }

  removeTag(transactionId: string, tagId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${transactionId}/tags/${tagId}`);
  }

  getSummary(params: GetTransactionsParams = {}): Observable<TransactionSummaryResponse> {
    let httpParams = new HttpParams();
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params.type != null) httpParams = httpParams.set('type', params.type);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.isConfirmed != null) httpParams = httpParams.set('isConfirmed', params.isConfirmed);
    if (params.familyGroupId) httpParams = httpParams.set('familyGroupId', params.familyGroupId);
    if (params.paymentMethod) httpParams = httpParams.set('paymentMethod', params.paymentMethod);
    return this.http.get<TransactionSummaryResponse>(`${this.base}/summary`, { params: httpParams });
  }

  getMonthlySummary(params: GetTransactionsParams = {}): Observable<MonthlyTransactionSummary[]> {
    let httpParams = new HttpParams();
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate);
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate);
    if (params.type != null) httpParams = httpParams.set('type', params.type);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId);
    if (params.isConfirmed != null) httpParams = httpParams.set('isConfirmed', params.isConfirmed);
    if (params.familyGroupId) httpParams = httpParams.set('familyGroupId', params.familyGroupId);
    if (params.paymentMethod) httpParams = httpParams.set('paymentMethod', params.paymentMethod);
    return this.http.get<MonthlyTransactionSummary[]>(`${this.base}/monthly-summary`, { params: httpParams });
  }
}
