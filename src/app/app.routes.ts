import { Routes } from '@angular/router';
import { authGuard, noAuthGuard } from './core/guards';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    title: 'Login | BudgetWise',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    title: 'Cadastro | BudgetWise',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard | BudgetWise',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'categories',
        title: 'Categorias | BudgetWise',
        loadComponent: () =>
          import('./features/categories/categories.component').then(m => m.CategoriesComponent),
      },
      {
        path: 'transactions',
        title: 'Transações | BudgetWise',
        loadComponent: () =>
          import('./features/transactions/transactions.component').then(m => m.TransactionsComponent),
      },
      {
        path: 'tags',
        title: 'Tags | BudgetWise',
        loadComponent: () =>
          import('./features/tags/tags.component').then(m => m.TagsComponent),
      },
    ],
  },
  {
    path: '**',
    title: 'Página não encontrada | BudgetWise',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
