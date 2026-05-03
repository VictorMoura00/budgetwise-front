import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DueTransactionsReportResponse } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/reports`;

  getDueTransactions(includeItems = true): Observable<DueTransactionsReportResponse> {
    const params = new HttpParams().set('includeItems', includeItems);
    return this.http.get<DueTransactionsReportResponse>(`${this.base}/due-transactions`, { params });
  }
}
