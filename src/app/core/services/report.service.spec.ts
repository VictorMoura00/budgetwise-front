import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportService } from './report.service';
import { DueTransactionsReportResponse } from '../models/report.models';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

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
});
