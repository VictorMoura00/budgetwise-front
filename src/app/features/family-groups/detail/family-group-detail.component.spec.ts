import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { FamilyGroupDetailComponent } from './family-group-detail.component';
import { FamilyGroupService } from '../../../core/services';
import { AuthService } from '../../../core/services';
import { MessageService, ConfirmationService } from 'primeng/api';

class MockFamilyGroupService {
  getById() {
    return of({
      id: 'g1',
      name: 'Test Group',
      description: 'A test group',
      inviteCode: 'abc123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      members: [
        { id: 'm1', userId: 'user-1', fullName: 'Owner User', email: 'owner@test.com', role: 'Owner' as const, joinedAt: '2024-01-01T00:00:00Z' },
        { id: 'm2', userId: 'user-2', fullName: 'Member User', email: 'member@test.com', role: 'Member' as const, joinedAt: '2024-01-02T00:00:00Z' },
      ],
    });
  }
  update() {
    return of({
      id: 'g1',
      name: 'Updated',
      description: 'Updated desc',
      inviteCode: 'abc123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
      members: [
        { id: 'm1', userId: 'user-1', fullName: 'Owner User', email: 'owner@test.com', role: 'Owner' as const, joinedAt: '2024-01-01T00:00:00Z' },
      ],
    });
  }
  delete() { return of(undefined); }
  regenerateInvite() { return of({ inviteCode: 'new-code-123' }); }
  removeMember() { return of(undefined); }
  leave() { return of(undefined); }
}

class MockAuthService {
  currentUser = signal({ userId: 'user-1', email: 'a@b.com', fullName: 'Test' });
  isAdmin = false;
}

class MockConfirmationService {
  confirm(_config: unknown) {
    const cfg = _config as { accept?: () => void };
    cfg.accept?.();
  }
}

describe('FamilyGroupDetailComponent', () => {
  let fixture: ComponentFixture<FamilyGroupDetailComponent>;
  let component: FamilyGroupDetailComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyGroupDetailComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'pt' }),
        { provide: FamilyGroupService, useClass: MockFamilyGroupService },
        { provide: AuthService, useClass: MockAuthService },
        { provide: ConfirmationService, useClass: MockConfirmationService },
        { provide: MessageService, useValue: { add: () => {} } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'g1' } } },
        },
        { provide: Router, useValue: { navigate: () => Promise.resolve(true) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyGroupDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read groupId from route and load group', () => {
    expect(component.groupId()).toBe('g1');
    expect(component.group()).not.toBeNull();
    expect(component.loading()).toBe(false);
  });

  it('should identify current user as Owner', () => {
    expect(component.isOwner()).toBe(true);
  });

  it('should open edit dialog with current values', () => {
    component.openEditDialog();
    expect(component.editDialogVisible).toBe(true);
    expect(component.editName).toBe('Test Group');
  });

  it('should call update on saveEdit', () => {
    component.openEditDialog();
    component.editName = 'Updated';
    component.saveEdit();
    expect(component.editDialogVisible).toBe(false);
  });

  it('should call delete when confirmed', () => {
    component.confirmDelete();
    // MockConfirmationService auto-accepts
  });

  it('should call regenerateInvite when confirmed', () => {
    component.confirmRegenerateInvite();
    // MockConfirmationService auto-accepts
  });

  it('should call removeMember when confirmed', () => {
    const member = { id: 'm2', userId: 'user-2', fullName: 'Member User', email: 'member@test.com', role: 'Member' as const, joinedAt: '' };
    component.confirmRemoveMember(member);
    // MockConfirmationService auto-accepts
  });

  it('should call leave when confirmed', () => {
    component.confirmLeave();
    // MockConfirmationService auto-accepts
  });
});
