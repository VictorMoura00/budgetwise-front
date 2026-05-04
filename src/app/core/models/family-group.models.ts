export type FamilyMemberRole = 'Owner' | 'Member';

export interface FamilyMemberResponse {
  id: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  role: FamilyMemberRole;
  joinedAt: string;
}

export interface FamilyGroupResponse {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  members: FamilyMemberResponse[];
}

export interface FamilyGroupSummaryResponse {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  createdAt: string;
}

export interface CreateFamilyGroupRequest {
  name: string;
  description: string | null;
}

export interface UpdateFamilyGroupRequest {
  name: string;
  description: string | null;
}

export interface JoinFamilyGroupRequest {
  inviteCode: string;
}

export interface PaginatedFamilyGroupResponse {
  items: FamilyGroupResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
