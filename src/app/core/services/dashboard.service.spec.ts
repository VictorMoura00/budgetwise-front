import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DashboardService } from './dashboard.service';
import { TransactionService } from './transaction.service';
import { DashboardOverviewResponse } from '../models/dashboard-overview.models';
import { DashboardFilterRequest } from '../models/dashboard-filter.models';
import { PaymentMethod } from '../models/transaction.models';
import { of } from 'rxjs';

class MockTransactionService {
  getSummary = vi.fn(() => of({ totalIncome: 0, totalExpense: 0, balance: 0, pendingCount: 0, pendingAmount: 0 }));
  getMonthlySummary = vi.fn(() => of([]));
  getAll = vi.fn(() => of({ items: [], pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0, hasPreviousPage: false, hasNextPage: false }));
}

describe('DashboardService', () => {
  let service: DashboardService;
  let httpMock: HttpTestingController;
  let mockTxService: MockTransactionService;

  const baseFilters: DashboardFilterRequest = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'all',
    type: 'all',
  };

  beforeEach(() => {
    mockTxService = new MockTransactionService();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DashboardService,
        { provide: TransactionService, useValue: mockTxService },
      ],
    });
    service = TestBed.inject(DashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call overview with startDate, endDate and optional filters', () => {
    const mockOverview: DashboardOverviewResponse = {
      period: { year: 2024, month: 1, startDate: '2024-01-01', endDate: '2024-01-31' },
      financialSummary: { totalIncome: 1000, totalExpense: 500, balance: 500, savingsRate: 10, confirmedBalance: 500, pendingImpact: 0, projectedBalance: 500 },
      pendingSummary: { totalPendingCount: 0, totalPendingAmount: 0, overdue: { count: 0, totalAmount: 0 }, dueToday: { count: 0, totalAmount: 0 }, dueNext7Days: { count: 0, totalAmount: 0 }, dueNext30Days: { count: 0, totalAmount: 0 }, future: { count: 0, totalAmount: 0 }, withoutDueDate: { count: 0, totalAmount: 0 } },
      categoryHighlights: { totalExpenseCategories: 0, topExpenseCategory: null, topIncomeCategory: null, fastestGrowingCategory: null },
      largestExpense: null,
      monthlyComparison: { previousIncome: 0, previousExpense: 0, incomeDiff: 0, incomeDiffPercent: null, expenseDiff: 0, expenseDiffPercent: null },
    };

    const filters: DashboardFilterRequest = {
      ...baseFilters,
      type: 'expense',
      status: 'pending',
      categoryId: 'cat-123',
      familyGroupId: 'fam-456',
      paymentMethod: PaymentMethod.CreditCard,
    };

    service.getOverview(filters).subscribe(res => {
      expect(res.financialSummary.totalIncome).toBe(1000);
    });

    const req = httpMock.expectOne(r => {
      const p = r.params;
      return r.url.includes('/dashboard/overview')
        && p.get('startDate') === '2024-01-01'
        && p.get('endDate') === '2024-01-31'
        && p.get('type') === 'Expense'
        && p.get('isConfirmed') === 'false'
        && p.get('categoryId') === 'cat-123'
        && p.get('familyGroupId') === 'fam-456'
        && p.get('paymentMethod') === 'CreditCard';
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockOverview);
  });

  it('should not send optional params when filters are "all" or empty', () => {
    const mockOverview: DashboardOverviewResponse = {
      period: { year: 2024, month: 1, startDate: '2024-01-01', endDate: '2024-01-31' },
      financialSummary: { totalIncome: 0, totalExpense: 0, balance: 0, savingsRate: null, confirmedBalance: 0, pendingImpact: 0, projectedBalance: 0 },
      pendingSummary: { totalPendingCount: 0, totalPendingAmount: 0, overdue: { count: 0, totalAmount: 0 }, dueToday: { count: 0, totalAmount: 0 }, dueNext7Days: { count: 0, totalAmount: 0 }, dueNext30Days: { count: 0, totalAmount: 0 }, future: { count: 0, totalAmount: 0 }, withoutDueDate: { count: 0, totalAmount: 0 } },
      categoryHighlights: { totalExpenseCategories: 0, topExpenseCategory: null, topIncomeCategory: null, fastestGrowingCategory: null },
      largestExpense: null,
      monthlyComparison: { previousIncome: 0, previousExpense: 0, incomeDiff: 0, incomeDiffPercent: null, expenseDiff: 0, expenseDiffPercent: null },
    };

    service.getOverview(baseFilters).subscribe(res => {
      expect(res).toBeTruthy();
    });

    const req = httpMock.expectOne(r => {
      const p = r.params;
      return r.url.includes('/dashboard/overview')
        && p.get('startDate') === '2024-01-01'
        && p.get('endDate') === '2024-01-31'
        && !p.has('type')
        && !p.has('isConfirmed')
        && !p.has('categoryId')
        && !p.has('familyGroupId')
        && !p.has('paymentMethod');
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockOverview);
  });
});
