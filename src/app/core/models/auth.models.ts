export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

export interface AuthResponse {
  userId: string;
  email: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
}

export interface ApiError {
  code: string;
  description: string;
}

export interface CurrentUserResponse {
  userId: string;
  email: string;
  fullName: string;
  role: 'User' | 'Admin';
  isActive: boolean;
}

export interface ProblemDetails {
  title: string;
  status: number;
  detail: string;
  errors?: ApiError[];
}
