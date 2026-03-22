import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Módulo-level para compartilhar estado entre chamadas simultâneas
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<string | null>(null);

export const tokenRefreshInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Não intercepta erros que não sejam 401 nem as rotas de auth (evita loop)
      if (error.status !== 401 || isAuthUrl(req)) {
        return throwError(() => error);
      }

      // Se já há um refresh em andamento, enfileira a requisição
      if (isRefreshing) {
        return refreshSubject.pipe(
          filter(token => token !== null),
          take(1),
          switchMap(token => next(withToken(req, token!))),
        );
      }

      isRefreshing = true;
      refreshSubject.next(null);

      return auth.refreshTokens().pipe(
        switchMap(() => {
          isRefreshing = false;
          const newToken = auth.accessToken!;
          refreshSubject.next(newToken);
          return next(withToken(req, newToken));
        }),
        catchError(err => {
          isRefreshing = false;
          auth.logout();
          return throwError(() => err);
        }),
      );
    }),
  );
};

function isAuthUrl(req: HttpRequest<unknown>): boolean {
  return req.url.includes('/auth/');
}

function withToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
