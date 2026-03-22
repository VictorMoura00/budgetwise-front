export interface CategoryResponse {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isActive: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
}

export type UpdateCategoryRequest = CreateCategoryRequest;

export interface GetCategoriesParams {
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedCategoryResponse {
  items: CategoryResponse[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
