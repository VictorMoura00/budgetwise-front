import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Protege rotas autenticadas. Redireciona para /login se não houver sessão. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.currentUser()) return true;
  return router.createUrlTree(['/login']);
};

/** Redireciona usuários já autenticados para /dashboard (uso em /login e /register). */
export const noAuthGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.currentUser()) return true;
  return router.createUrlTree(['/dashboard']);
};
