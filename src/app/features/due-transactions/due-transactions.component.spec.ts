import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { DueTransactionsComponent } from './due-transactions.component';
import { ReportService } from '../../core/services';

class MockReportService {
  getDueTransactions() {
    return of({
      reportDate: '2024-01-01',
      totalPendingCount: 3,
      totalPendingAmount: 500,
      overdue: { count: 1, totalAmount: 100, items: [] },
      dueToday: { count: 1, totalAmount: 200, items: [] },
      dueNext7Days: { count: 1, totalAmount: 200, items: [] },
      dueNext30Days: { count: 0, totalAmount: 0, items: [] },
      future: { count: 0, totalAmount: 0, items: [] },
      withoutDueDate: { count: 0, totalAmount: 0, items: [] },
    });
  }
}

describe('DueTransactionsComponent', () => {
  let fixture: ComponentFixture<DueTransactionsComponent>;
  let component: DueTransactionsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DueTransactionsComponent],
      providers: [
        provideTranslateService({ defaultLanguage: 'pt' }),
        { provide: ReportService, useClass: MockReportService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DueTransactionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load due transactions on init', () => {
    expect(component.data()).not.toBeNull();
    expect(component.data()?.totalPendingCount).toBe(3);
    expect(component.loading()).toBe(false);
  });

  it('should format currency correctly', () => {
    const formatted = component.formatCurrency(1234.56);
    expect(formatted).toContain('R$');
  });
});
