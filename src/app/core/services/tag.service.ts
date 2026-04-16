import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateTagRequest, TagResponse, UpdateTagRequest } from '../models/tag.models';

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/tags`;
  private readonly transactionsBase = `${environment.apiUrl}/transactions`;

  getAll(): Observable<TagResponse[]> {
    return this.http.get<TagResponse[]>(this.base);
  }

  create(request: CreateTagRequest): Observable<TagResponse> {
    return this.http.post<TagResponse>(this.base, request);
  }

  update(id: string, request: UpdateTagRequest): Observable<TagResponse> {
    return this.http.put<TagResponse>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addToTransaction(transactionId: string, tagId: string): Observable<void> {
    return this.http.post<void>(`${this.transactionsBase}/${transactionId}/tags/${tagId}`, {});
  }

  removeFromTransaction(transactionId: string, tagId: string): Observable<void> {
    return this.http.delete<void>(`${this.transactionsBase}/${transactionId}/tags/${tagId}`);
  }
}
