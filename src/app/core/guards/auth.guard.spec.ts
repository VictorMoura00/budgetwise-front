import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { authGuard, noAuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function createMockAuth(user: boolean) {
  return {
    currentUser: signal(user ? { userId: '1', email: 'a@b.com', fullName: 'Test' } : null),
  } as unknown as AuthService;
}

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = { url: '/' } as RouterStateSnapshot;

describe('authGuard', () => {
  it('should allow access when user is authenticated', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: createMockAuth(true) }],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should redirect to /login when user is not authenticated', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: createMockAuth(false) }],
    });

    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as unknown as UrlTree).toString()).toBe('/login');
  });
});

describe('noAuthGuard', () => {
  it('should allow access when user is not authenticated', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: createMockAuth(false) }],
    });

    const result = TestBed.runInInjectionContext(() => noAuthGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when user is authenticated', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: createMockAuth(true) }],
    });

    const result = TestBed.runInInjectionContext(() => noAuthGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as unknown as UrlTree).toString()).toBe('/dashboard');
  });
});
