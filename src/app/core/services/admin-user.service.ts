import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AdminUserResponse,
  PaginatedAdminUserResponse,
  UpdateAdminUserRequest,
  UpdateAdminUserRoleRequest,
} from '../models/admin.models';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/admin/users`;

  getAll(pageNumber = 1, pageSize = 20): Observable<PaginatedAdminUserResponse> {
    const params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);
    return this.http.get<PaginatedAdminUserResponse>(this.base, { params });
  }

  getById(id: string): Observable<AdminUserResponse> {
    return this.http.get<AdminUserResponse>(`${this.base}/${id}`);
  }

  update(id: string, request: UpdateAdminUserRequest): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(`${this.base}/${id}`, request);
  }

  toggleStatus(id: string): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(`${this.base}/${id}/toggle-status`, {});
  }

  unlock(id: string): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(`${this.base}/${id}/unlock`, {});
  }

  updateRole(id: string, request: UpdateAdminUserRoleRequest): Observable<AdminUserResponse> {
    return this.http.patch<AdminUserResponse>(`${this.base}/${id}/role`, request);
  }
}
