import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateSharedExpenseRequest,
  PaginatedSharedExpenseResponse,
  SharedExpenseResponse,
  SharedExpenseSummaryResponse,
} from '../models/shared-expense.models';

@Injectable({ providedIn: 'root' })
export class SharedExpenseService {
  private readonly http = inject(HttpClient);

  private base(groupId: string): string {
    return `${environment.apiUrl}/family-groups/${groupId}/shared-expenses`;
  }

  getAll(groupId: string): Observable<PaginatedSharedExpenseResponse> {
    return this.http.get<PaginatedSharedExpenseResponse>(this.base(groupId));
  }

  getById(groupId: string, id: string): Observable<SharedExpenseResponse> {
    return this.http.get<SharedExpenseResponse>(`${this.base(groupId)}/${id}`);
  }

  getSummary(groupId: string): Observable<SharedExpenseSummaryResponse> {
    return this.http.get<SharedExpenseSummaryResponse>(`${this.base(groupId)}/summary`);
  }

  create(groupId: string, request: CreateSharedExpenseRequest): Observable<SharedExpenseResponse> {
    return this.http.post<SharedExpenseResponse>(this.base(groupId), request);
  }

  settleParticipant(groupId: string, expenseId: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.base(groupId)}/${expenseId}/participants/${userId}/settle`, {});
  }
}
