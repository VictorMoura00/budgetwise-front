import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { SharedExpenseService } from '../../core/services';
import { SharedExpenseResponse, SharedExpenseSummaryResponse } from '../../core/models';

@Component({
  selector: 'app-shared-expenses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, TranslateModule, ButtonModule, SkeletonModule],
  templateUrl: './shared-expenses.component.html',
  styleUrl: './shared-expenses.component.scss',
})
export class SharedExpensesComponent implements OnInit {
  private readonly service = inject(SharedExpenseService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);

  groupId = signal<string | null>(null);
  expenses = signal<SharedExpenseResponse[]>([]);
  summary = signal<SharedExpenseSummaryResponse | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    const groupId = this.route.snapshot.paramMap.get('groupId');
    if (groupId) {
      this.load(groupId);
    } else {
      this.loading.set(false);
    }
  }

  load(groupId: string): void {
    this.loading.set(true);
    this.groupId.set(groupId);

    this.service.getAll(groupId).pipe(takeUntilDestroyed()).subscribe({
      next: res => {
        this.expenses.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.service.getSummary(groupId).pipe(takeUntilDestroyed()).subscribe({
      next: res => this.summary.set(res),
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
