import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AdminUsersComponent } from './users.component';
import { AdminUserService } from '../../../core/services';
import { MessageService, ConfirmationService } from 'primeng/api';

class MockAdminUserService {
  getAll() {
    return of({
      items: [
        { id: 'u1', fullName: 'Alice', email: 'alice@example.com', role: 'Admin', isActive: true, isLocked: false, createdAt: '', updatedAt: '' },
        { id: 'u2', fullName: 'Bob', email: 'bob@example.com', role: 'User', isActive: false, isLocked: true, createdAt: '', updatedAt: '' },
      ],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 2,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    });
  }
  getById() {
    return of({ id: 'u1', fullName: 'Alice', email: 'alice@example.com', role: 'Admin', isActive: true, isLocked: false, createdAt: '', updatedAt: '' });
  }
  update() {
    return of({ id: 'u1', fullName: 'Alice Updated', email: 'alice@example.com', role: 'Admin', isActive: true, isLocked: false, createdAt: '', updatedAt: '' });
  }
  updateRole() {
    return of({ id: 'u1', fullName: 'Alice', email: 'alice@example.com', role: 'User', isActive: true, isLocked: false, createdAt: '', updatedAt: '' });
  }
  toggleStatus() {
    return of({ id: 'u1', fullName: 'Alice', email: 'alice@example.com', role: 'Admin', isActive: false, isLocked: false, createdAt: '', updatedAt: '' });
  }
  unlock() {
    return of({ id: 'u2', fullName: 'Bob', email: 'bob@example.com', role: 'User', isActive: false, isLocked: false, createdAt: '', updatedAt: '' });
  }
}

class MockConfirmationService {
  confirm(_config: unknown) {
    const cfg = _config as { accept?: () => void };
    cfg.accept?.();
  }
}

describe('AdminUsersComponent', () => {
  let fixture: ComponentFixture<AdminUsersComponent>;
  let component: AdminUsersComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminUsersComponent],
      providers: [
        provideTranslateService({ defaultLanguage: 'pt' }),
        { provide: AdminUserService, useClass: MockAdminUserService },
        { provide: ConfirmationService, useClass: MockConfirmationService },
        { provide: MessageService, useValue: { add: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(component.users().length).toBe(2);
    expect(component.totalRecords()).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should open edit dialog', () => {
    const user = component.users()[0];
    expect(component.editDialogVisible()).toBe(false);
    component.openEdit(user);
    expect(component.editDialogVisible()).toBe(true);
    expect(component.editingUser()).toBeTruthy();
  });

  it('should save edit', () => {
    component.openEdit(component.users()[0]);
    component.editForm.patchValue({ fullName: 'Alice Updated', email: 'alice@example.com' });
    component.saveEdit();
    expect(component.editDialogVisible()).toBe(false);
  });

  it('should open role dialog', () => {
    const user = component.users()[0];
    expect(component.roleDialogVisible()).toBe(false);
    component.openRoleDialog(user);
    expect(component.roleDialogVisible()).toBe(true);
    expect(component.roleUser()?.id).toBe(user.id);
  });

  it('should confirm and save role change', () => {
    component.openRoleDialog(component.users()[0]);
    component.selectedRole.set('User');
    component.confirmRoleChange();
    // MockConfirmationService auto-accepts
    expect(component.roleDialogVisible()).toBe(false);
  });

  it('should toggle status when confirmed', () => {
    component.confirmToggleStatus(component.users()[0]);
    // MockConfirmationService auto-accepts
  });

  it('should unlock user when confirmed', () => {
    component.confirmUnlock(component.users()[1]);
    // MockConfirmationService auto-accepts
  });
});
