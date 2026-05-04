import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, map, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { AuthResponse, CurrentUserResponse, LoginRequest, RegisterRequest } from '../models/auth.models';

export interface UserInfo {
  userId: string;
  email: string;
  fullName: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface JwtPayload {
  sub?: string;
  email?: string;
  fullName?: string;
  role?: string;
  exp?: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly USER_KEY = 'bw_user';
  private readonly TOKEN_KEY = 'bw_tokens';

  currentUser = signal<UserInfo | null>(this.loadFromStorage<UserInfo>(this.USER_KEY));
  private tokens = signal<TokenPair | null>(this.loadFromStorage<TokenPair>(this.TOKEN_KEY));

  get accessToken(): string | null {
    return this.tokens()?.accessToken ?? null;
  }

  get isAdmin(): boolean {
    return this.currentUser()?.role === 'Admin';
  }

  refreshTokens(): Observable<void> {
    const userId = this.currentUser()?.userId;
    const refreshToken = this.tokens()?.refreshToken;

    if (!userId || !refreshToken) {
      return throwError(() => new Error('No session'));
    }

    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { userId, refreshToken })
      .pipe(tap(res => this.storeSession(res)), map(() => undefined));
  }

  login(request: LoginRequest): Observable<void> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(tap(res => this.storeSession(res)), map(() => undefined));
  }

  register(request: RegisterRequest): Observable<void> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(tap(res => this.storeSession(res)), map(() => undefined));
  }

  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${environment.apiUrl}/auth/me`);
  }

  logout(): void {
    this.currentUser.set(null);
    this.tokens.set(null);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  private storeSession(res: AuthResponse): void {
    const role = this.extractRoleFromToken(res.accessToken);
    const user: UserInfo = { userId: res.userId, email: res.email, fullName: res.fullName, role };
    const tokens: TokenPair = { accessToken: res.accessToken, refreshToken: res.refreshToken };
    this.currentUser.set(user);
    this.tokens.set(tokens);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
  }

  private extractRoleFromToken(token: string): string {
    try {
      const payload = jwtDecode<JwtPayload>(token);
      return payload.role ?? 'User';
    } catch {
      return 'User';
    }
  }

  private loadFromStorage<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }
}
