import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ReportService } from '../../core/services';
import { DueTransactionItem, DueTransactionsReportResponse } from '../../core/models';

@Component({
  selector: 'app-due-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, ButtonModule, SkeletonModule, DatePipe, NgClass],
  templateUrl: './due-transactions.component.html',
  styleUrl: './due-transactions.component.scss',
})
export class DueTransactionsComponent implements OnInit {
  private readonly service = inject(ReportService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  loading = signal(true);
  data = signal<DueTransactionsReportResponse | null>(null);

  readonly groups = [
    { key: 'overdue' as const, severity: 'danger' as const },
    { key: 'dueToday' as const, severity: 'warn' as const },
    { key: 'dueNext7Days' as const, severity: 'info' as const },
    { key: 'dueNext30Days' as const, severity: 'secondary' as const },
    { key: 'future' as const, severity: 'success' as const },
    { key: 'withoutDueDate' as const, severity: 'contrast' as const },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getDueTransactions(true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  groupTitle(key: string): string {
    const map: Record<string, string> = {
      overdue: 'dueTransactions.groups.overdue',
      dueToday: 'dueTransactions.groups.dueToday',
      dueNext7Days: 'dueTransactions.groups.dueNext7Days',
      dueNext30Days: 'dueTransactions.groups.dueNext30Days',
      future: 'dueTransactions.groups.future',
      withoutDueDate: 'dueTransactions.groups.withoutDueDate',
    };
    return this.translate.instant(map[key] ?? key);
  }

  getGroup(key: string): { count: number; totalAmount: number; items: DueTransactionItem[] } | null {
    const d = this.data();
    if (!d) return null;
    return (d as any)[key] ?? null;
  }
}
