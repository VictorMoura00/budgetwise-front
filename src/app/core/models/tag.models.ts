export interface TagResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagRequest {
  name: string;
}

export interface UpdateTagRequest {
  name: string;
}
