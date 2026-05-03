import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SharedExpenseService } from './shared-expense.service';
import {
  CreateSharedExpenseRequest,
  PaginatedSharedExpenseResponse,
  SharedExpenseResponse,
  SharedExpenseSummaryResponse,
} from '../models/shared-expense.models';

describe('SharedExpenseService', () => {
  let service: SharedExpenseService;
  let httpMock: HttpTestingController;
  const groupId = 'group-1';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SharedExpenseService],
    });
    service = TestBed.inject(SharedExpenseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a shared expense', () => {
    const request: CreateSharedExpenseRequest = {
      description: 'Test expense',
      totalAmount: 100,
      expenseDate: '2024-01-15',
      categoryId: null,
      participants: [{ userId: 'user-1', amountOwed: 50 }],
    };

    const mockResponse: SharedExpenseResponse = {
      id: 'exp-1',
      familyGroupId: groupId,
      transactionId: 'tx-1',
      description: 'Test expense',
      totalAmount: 100,
      createdBy: 'user-1',
      totalSettled: 0,
      totalPending: 100,
      isFullySettled: false,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      participants: [],
    };

    service.create(groupId, request).subscribe(res => {
      expect(res.description).toBe('Test expense');
      expect(res.totalAmount).toBe(100);
    });

    const req = httpMock.expectOne(`${service['base'](groupId)}`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResponse);
  });

  it('should get shared expense by id', () => {
    const expenseId = 'exp-1';
    const mockResponse: SharedExpenseResponse = {
      id: expenseId,
      familyGroupId: groupId,
      transactionId: 'tx-1',
      description: 'Detail test',
      totalAmount: 200,
      createdBy: 'user-1',
      totalSettled: 100,
      totalPending: 100,
      isFullySettled: false,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-15T00:00:00Z',
      participants: [
        { id: 'p-1', userId: 'user-1', amountOwed: 100, isSettled: true, settledAt: '2024-01-16T00:00:00Z' },
        { id: 'p-2', userId: 'user-2', amountOwed: 100, isSettled: false, settledAt: null },
      ],
    };

    service.getById(groupId, expenseId).subscribe(res => {
      expect(res.id).toBe(expenseId);
      expect(res.participants.length).toBe(2);
    });

    const req = httpMock.expectOne(`${service['base'](groupId)}/${expenseId}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should settle a participant', () => {
    const expenseId = 'exp-1';
    const userId = 'user-2';

    service.settleParticipant(groupId, expenseId, userId).subscribe(() => {
      expect(true).toBe(true);
    });

    const req = httpMock.expectOne(`${service['base'](groupId)}/${expenseId}/participants/${userId}/settle`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(null);
  });

  it('should get all shared expenses', () => {
    const mockResponse: PaginatedSharedExpenseResponse = {
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    };

    service.getAll(groupId).subscribe(res => {
      expect(res.totalCount).toBe(0);
    });

    const req = httpMock.expectOne(`${service['base'](groupId)}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get summary', () => {
    const mockResponse: SharedExpenseSummaryResponse = {
      totalExpenses: 1,
      totalAmount: 100,
      totalSettled: 50,
      totalPending: 50,
      fullySettledCount: 0,
      partiallySettledCount: 1,
      unsettledCount: 0,
      participantTotals: [],
    };

    service.getSummary(groupId).subscribe(res => {
      expect(res.totalAmount).toBe(100);
    });

    const req = httpMock.expectOne(`${service['base'](groupId)}/summary`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
