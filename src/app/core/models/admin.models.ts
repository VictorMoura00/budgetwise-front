export interface AdminUserResponse {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateAdminUserRequest {
  fullName?: string;
  email?: string;
}

export interface UpdateAdminUserRoleRequest {
  role: string;
}

export interface PaginatedAdminUserResponse {
  items: AdminUserResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
