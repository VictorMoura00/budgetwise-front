import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminUserService } from './admin-user.service';
import { AdminUserResponse, PaginatedAdminUserResponse, UpdateAdminUserRequest, UpdateAdminUserRoleRequest } from '../models/admin.models';

describe('AdminUserService', () => {
  let service: AdminUserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminUserService],
    });
    service = TestBed.inject(AdminUserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get user by id', () => {
    const userId = 'user-1';
    const mockResponse: AdminUserResponse = {
      id: userId,
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'User',
      isActive: true,
      isLocked: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    service.getById(userId).subscribe(res => {
      expect(res.id).toBe(userId);
      expect(res.fullName).toBe('Test User');
      expect(res.email).toBe('test@example.com');
    });

    const req = httpMock.expectOne(`${service['base']}/${userId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should update user', () => {
    const userId = 'user-1';
    const request: UpdateAdminUserRequest = {
      fullName: 'Updated Name',
      email: 'updated@example.com',
    };

    const mockResponse: AdminUserResponse = {
      id: userId,
      fullName: 'Updated Name',
      email: 'updated@example.com',
      role: 'User',
      isActive: true,
      isLocked: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    service.update(userId, request).subscribe(res => {
      expect(res.fullName).toBe('Updated Name');
      expect(res.email).toBe('updated@example.com');
    });

    const req = httpMock.expectOne(`${service['base']}/${userId}`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should update user role', () => {
    const userId = 'user-1';
    const request: UpdateAdminUserRoleRequest = { role: 'Admin' };

    const mockResponse: AdminUserResponse = {
      id: userId,
      fullName: 'Test User',
      email: 'test@example.com',
      role: 'Admin',
      isActive: true,
      isLocked: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    service.updateRole(userId, request).subscribe(res => {
      expect(res.role).toBe('Admin');
    });

    const req = httpMock.expectOne(`${service['base']}/${userId}/role`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should get all users with pagination', () => {
    const mockResponse: PaginatedAdminUserResponse = {
      items: [],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    service.getAll(1, 20).subscribe(res => {
      expect(res.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(r => r.url === service['base'] && r.params.get('pageNumber') === '1' && r.params.get('pageSize') === '20');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should toggle status', () => {
    const userId = 'user-1';
    const mockResponse: AdminUserResponse = {
      id: userId,
      fullName: 'Test',
      email: 'test@example.com',
      role: 'User',
      isActive: false,
      isLocked: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    service.toggleStatus(userId).subscribe(res => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne(`${service['base']}/${userId}/toggle-status`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockResponse);
  });

  it('should unlock user', () => {
    const userId = 'user-1';
    const mockResponse: AdminUserResponse = {
      id: userId,
      fullName: 'Test',
      email: 'test@example.com',
      role: 'User',
      isActive: true,
      isLocked: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    };

    service.unlock(userId).subscribe(res => {
      expect(res.isLocked).toBe(false);
    });

    const req = httpMock.expectOne(`${service['base']}/${userId}/unlock`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockResponse);
  });
});
