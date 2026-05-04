import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { SharedExpensesComponent } from './shared-expenses.component';
import { SharedExpenseService } from '../../core/services';
import { FamilyGroupService } from '../../core/services';
import { CategoryService } from '../../core/services';
import { MessageService } from 'primeng/api';

class MockSharedExpenseService {
  getAll() {
    return of({
      items: [
        {
          id: 'exp-1',
          familyGroupId: 'group-1',
          transactionId: 'tx-1',
          description: 'Test',
          totalAmount: 100,
          createdBy: 'user-1',
          totalSettled: 0,
          totalPending: 100,
          isFullySettled: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          participants: [{ id: 'p-1', userId: 'user-1', amountOwed: 100, isSettled: false, settledAt: null }],
        },
      ],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    });
  }
  getSummary() {
    return of({
      totalExpenses: 1,
      totalAmount: 100,
      totalSettled: 0,
      totalPending: 100,
      fullySettledCount: 0,
      partiallySettledCount: 1,
      unsettledCount: 0,
      participantTotals: [],
    });
  }
  getById() {
    return of({
      id: 'exp-1',
      familyGroupId: 'group-1',
      transactionId: 'tx-1',
      description: 'Test detail',
      totalAmount: 100,
      createdBy: 'user-1',
      totalSettled: 0,
      totalPending: 100,
      isFullySettled: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      participants: [{ id: 'p-1', userId: 'user-1', amountOwed: 100, isSettled: false, settledAt: null }],
    });
  }
  create() {
    return of({
      id: 'exp-2',
      familyGroupId: 'group-1',
      transactionId: 'tx-2',
      description: 'New',
      totalAmount: 50,
      createdBy: 'user-1',
      totalSettled: 0,
      totalPending: 50,
      isFullySettled: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      participants: [],
    });
  }
}

class MockFamilyGroupService {
  getById() {
    return of({
      id: 'group-1',
      name: 'Test Group',
      description: null,
      inviteCode: 'abc123',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      members: [{ id: 'm-1', userId: 'user-1', role: 'Owner' as const, joinedAt: '2024-01-01T00:00:00Z' }],
    });
  }
}

class MockCategoryService {
  getAll() {
    return of({
      items: [
        { id: 'cat-1', name: 'Food', description: null, icon: null, color: null, isSystem: false, isActive: true, categoryType: 'Expense' as const, userId: null, createdAt: '', updatedAt: '' },
      ],
      pageNumber: 1,
      pageSize: 100,
      totalCount: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    });
  }
}

describe('SharedExpensesComponent', () => {
  let fixture: ComponentFixture<SharedExpensesComponent>;
  let component: SharedExpensesComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedExpensesComponent],
      providers: [
        provideTranslateService({ fallbackLang: 'pt' }),
        { provide: SharedExpenseService, useClass: MockSharedExpenseService },
        { provide: FamilyGroupService, useClass: MockFamilyGroupService },
        { provide: CategoryService, useClass: MockCategoryService },
        { provide: MessageService, useValue: { add: () => {} } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'group-1' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedExpensesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load expenses on init', () => {
    expect(component.groupId()).toBe('group-1');
    expect(component.expenses().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('should open create dialog', () => {
    expect(component.createDialogVisible()).toBe(false);
    component.openCreateDialog();
    expect(component.createDialogVisible()).toBe(true);
  });

  it('should add and remove participants', () => {
    component.openCreateDialog();
    expect(component.participantsArray.length).toBe(0);
    component.addParticipant();
    expect(component.participantsArray.length).toBe(1);
    component.removeParticipant(0);
    expect(component.participantsArray.length).toBe(0);
  });

  it('should calculate participant error when duplicates exist', () => {
    component.openCreateDialog();
    component.addParticipant();
    component.addParticipant();
    component.participantsArray.at(0).patchValue({ userId: 'user-1', amountOwed: 10 });
    component.participantsArray.at(1).patchValue({ userId: 'user-1', amountOwed: 10 });
    expect(component.participantError()).not.toBeNull();
  });

  it('should open detail dialog', () => {
    const expense = component.expenses()[0];
    expect(component.detailDialogVisible()).toBe(false);
    component.openDetail(expense);
    expect(component.detailDialogVisible()).toBe(true);
    expect(component.selectedExpense()).toBeTruthy();
  });
});
