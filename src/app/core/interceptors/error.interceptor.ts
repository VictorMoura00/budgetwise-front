import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);
  const translate = inject(TranslateService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401 is handled by tokenRefreshInterceptor; auth URLs handle their own errors
      if (error.status === 401 || req.url.includes('/auth/')) {
        return throwError(() => error);
      }

      // 404 on GET requests is expected (empty list, resource not yet created)
      if (error.status === 404 && req.method === 'GET') {
        return throwError(() => error);
      }

      const detail =
        error.error?.detail ??
        error.error?.title ??
        translate.instant('errors.generic');

      messageService.add({
        severity: 'error',
        summary: translate.instant('common.error'),
        detail,
        life: 5000,
      });

      return throwError(() => error);
    }),
  );
};
