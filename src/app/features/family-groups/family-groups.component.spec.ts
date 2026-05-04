import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FamilyGroupsComponent } from './family-groups.component';
import { FamilyGroupService } from '../../core/services';
import { MessageService, ConfirmationService } from 'primeng/api';

class MockFamilyGroupService {
  getAll() {
    return of([
      { id: 'g1', name: 'Group A', description: 'Desc A', memberCount: 2, createdAt: '2024-01-01T00:00:00Z' },
      { id: 'g2', name: 'Group B', description: null, memberCount: 1, createdAt: '2024-01-02T00:00:00Z' },
    ]);
  }
  create() { return of({ id: 'g3', name: 'New', description: null, inviteCode: 'abc', createdAt: '', updatedAt: '', members: [] }); }
  join() { return of({ id: 'g1', name: 'Group A', description: null, inviteCode: 'abc', createdAt: '', updatedAt: '', members: [] }); }
  leave() { return of(undefined); }
}

class MockConfirmationService {
  confirm(_config: unknown) {
    // simulate immediate accept
    const cfg = _config as { accept?: () => void };
    cfg.accept?.();
  }
}

describe('FamilyGroupsComponent', () => {
  let fixture: ComponentFixture<FamilyGroupsComponent>;
  let component: FamilyGroupsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FamilyGroupsComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'pt' }),
        { provide: FamilyGroupService, useClass: MockFamilyGroupService },
        { provide: ConfirmationService, useClass: MockConfirmationService },
        { provide: MessageService, useValue: { add: () => {} } },
        { provide: ActivatedRoute, useValue: {} },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FamilyGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load groups on init', () => {
    expect(component.groups().length).toBe(2);
    expect(component.loading()).toBe(false);
  });

  it('should open create dialog', () => {
    expect(component.dialogVisible).toBe(false);
    component.openCreateDialog();
    expect(component.dialogVisible).toBe(true);
    expect(component.groupName).toBe('');
  });

  it('should open join dialog', () => {
    expect(component.joinDialogVisible).toBe(false);
    component.openJoinDialog();
    expect(component.joinDialogVisible).toBe(true);
    expect(component.inviteCode).toBe('');
  });

  it('should create group and reload', () => {
    component.openCreateDialog();
    component.groupName = 'Test Group';
    component.createGroup();
    expect(component.dialogVisible).toBe(false);
  });

  it('should join group and reload', () => {
    component.openJoinDialog();
    component.inviteCode = 'INVITE123';
    component.joinGroup();
    expect(component.joinDialogVisible).toBe(false);
  });

  it('should call leave when confirmed', () => {
    const group = component.groups()[0];
    component.confirmLeave(group);
    // MockConfirmationService auto-accepts
  });
});
