import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

function createMockAuth(role: string) {
  return {
    currentUser: signal({ userId: '1', email: 'a@b.com', fullName: 'Test', role }),
    isAdmin: role === 'Admin',
  } as unknown as AuthService;
}

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = { url: '/' } as RouterStateSnapshot;

describe('adminGuard', () => {
  it('should allow access when user is Admin', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: createMockAuth('Admin') }],
    });

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('should redirect to /dashboard when user is not Admin', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: createMockAuth('User') }],
    });

    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as unknown as UrlTree).toString()).toBe('/dashboard');
  });
});
