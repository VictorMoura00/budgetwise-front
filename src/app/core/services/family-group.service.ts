import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateFamilyGroupRequest,
  FamilyGroupResponse,
  FamilyGroupSummaryResponse,
  JoinFamilyGroupRequest,
  UpdateFamilyGroupRequest,
} from '../models/family-group.models';

@Injectable({ providedIn: 'root' })
export class FamilyGroupService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/family-groups`;

  getAll(): Observable<FamilyGroupSummaryResponse[]> {
    return this.http.get<FamilyGroupSummaryResponse[]>(this.base);
  }

  getById(id: string): Observable<FamilyGroupResponse> {
    return this.http.get<FamilyGroupResponse>(`${this.base}/${id}`);
  }

  create(request: CreateFamilyGroupRequest): Observable<FamilyGroupResponse> {
    return this.http.post<FamilyGroupResponse>(this.base, request);
  }

  update(id: string, request: UpdateFamilyGroupRequest): Observable<FamilyGroupResponse> {
    return this.http.put<FamilyGroupResponse>(`${this.base}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  join(request: JoinFamilyGroupRequest): Observable<FamilyGroupResponse> {
    return this.http.post<FamilyGroupResponse>(`${this.base}/join`, request);
  }

  leave(id: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/leave`, {});
  }

  removeMember(id: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}/members/${userId}`);
  }

  regenerateInvite(id: string): Observable<{ inviteCode: string }> {
    return this.http.post<{ inviteCode: string }>(`${this.base}/${id}/invite/regenerate`, {});
  }
}
