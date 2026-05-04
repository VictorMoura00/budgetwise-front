import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { CategoryAnalysisReportResponse, DueTransactionsReportResponse, PaymentStatusReportResponse } from '../models/report.models';
import { DashboardFilterRequest } from '../models/dashboard-filter.models';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  const baseFilters: DashboardFilterRequest = {
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    status: 'all',
    type: 'all',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ReportService],
    });
    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch due transactions with includeItems=true by default', () => {
    const mockResponse: DueTransactionsReportResponse = {
      reportDate: '2024-01-01',
      totalPendingCount: 5,
      totalPendingAmount: 1000,
      overdue: { count: 1, totalAmount: 200, items: [] },
      dueToday: { count: 1, totalAmount: 200, items: [] },
      dueNext7Days: { count: 1, totalAmount: 200, items: [] },
      dueNext30Days: { count: 1, totalAmount: 200, items: [] },
      future: { count: 1, totalAmount: 200, items: [] },
      withoutDueDate: { count: 0, totalAmount: 0, items: [] },
    };

    service.getDueTransactions().subscribe(res => {
      expect(res.totalPendingCount).toBe(5);
      expect(res.totalPendingAmount).toBe(1000);
    });

    const req = httpMock.expectOne(r => r.url.includes('/reports/due-transactions') && r.params.get('includeItems') === 'true');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch category analysis with correct query params', () => {
    const mockResponse: CategoryAnalysisReportResponse = {
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      totalAmount: 5000,
      totalTransactions: 42,
      items: [],
    };

    const filters: DashboardFilterRequest = {
      ...baseFilters,
      type: 'expense',
      status: 'confirmed',
      categoryId: 'cat-123',
    };

    service.getCategoryAnalysis(filters).subscribe(res => {
      expect(res.totalAmount).toBe(5000);
      expect(res.totalTransactions).toBe(42);
    });

    const req = httpMock.expectOne(r => {
      const p = r.params;
      return r.url.includes('/reports/category-analysis')
        && p.get('startDate') === '2024-01-01'
        && p.get('endDate') === '2024-01-31'
        && p.get('type') === 'Expense'
        && p.get('isConfirmed') === 'true'
        && p.get('categoryId') === 'cat-123';
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch payment status with correct query params', () => {
    const mockResponse: PaymentStatusReportResponse = {
      reportDate: '2024-01-01',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      confirmed: { count: 10, totalAmount: 3000 },
      pending: { count: 5, totalAmount: 1000 },
      overdue: { count: 1, totalAmount: 200 },
      dueToday: { count: 2, totalAmount: 400 },
      dueNext7Days: { count: 3, totalAmount: 600 },
      withoutDueDate: { count: 0, totalAmount: 0 },
    };

    service.getPaymentStatus(baseFilters).subscribe(res => {
      expect(res.confirmed.count).toBe(10);
      expect(res.pending.count).toBe(5);
    });

    const req = httpMock.expectOne(r => {
      const p = r.params;
      return r.url.includes('/reports/payment-status')
        && p.get('startDate') === '2024-01-01'
        && p.get('endDate') === '2024-01-31';
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
