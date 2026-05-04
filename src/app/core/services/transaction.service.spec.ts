import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { MonthlyTransactionSummary, TransactionSummaryResponse, TransactionType, PaymentMethod } from '../models/transaction.models';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TransactionService],
    });
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch monthly summary with advanced filters', () => {
    const mockResponse: MonthlyTransactionSummary[] = [
      { month: '2024-01', income: 1000, expense: 500 },
      { month: '2024-02', income: 1200, expense: 600 },
    ];

    service.getMonthlySummary({
      startDate: '2024-01-01',
      endDate: '2024-02-29',
      type: TransactionType.Expense,
      isConfirmed: true,
      categoryId: 'cat-1',
      familyGroupId: 'fam-1',
      paymentMethod: PaymentMethod.Pix,
    }).subscribe(res => {
      expect(res.length).toBe(2);
      expect(res[0].month).toBe('2024-01');
    });

    const req = httpMock.expectOne(r => {
      const p = r.params;
      return r.url.includes('/transactions/monthly-summary')
        && p.get('startDate') === '2024-01-01'
        && p.get('endDate') === '2024-02-29'
        && p.get('type') === 'Expense'
        && p.get('isConfirmed') === 'true'
        && p.get('categoryId') === 'cat-1'
        && p.get('familyGroupId') === 'fam-1'
        && p.get('paymentMethod') === 'Pix';
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should fetch summary with advanced filters', () => {
    const mockResponse: TransactionSummaryResponse = {
      totalIncome: 1000,
      totalExpense: 500,
      balance: 500,
      pendingCount: 2,
      pendingAmount: 300,
    };

    service.getSummary({
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      type: TransactionType.Income,
      isConfirmed: false,
    }).subscribe(res => {
      expect(res.totalIncome).toBe(1000);
    });

    const req = httpMock.expectOne(r => {
      const p = r.params;
      return r.url.includes('/transactions/summary')
        && p.get('startDate') === '2024-01-01'
        && p.get('endDate') === '2024-01-31'
        && p.get('type') === 'Income'
        && p.get('isConfirmed') === 'false';
    });
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
