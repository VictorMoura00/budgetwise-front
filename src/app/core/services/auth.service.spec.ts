import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { CurrentUserResponse } from '../models/auth.models';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch current user from /auth/me', () => {
    const mockUser: CurrentUserResponse = {
      userId: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'Admin',
      isActive: true,
    };

    service.getCurrentUser().subscribe(res => {
      expect(res.userId).toBe('user-123');
      expect(res.email).toBe('test@example.com');
      expect(res.fullName).toBe('Test User');
      expect(res.role).toBe('Admin');
      expect(res.isActive).toBe(true);
    });

    const req = httpMock.expectOne(r => r.url.includes('/auth/me'));
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });
});
