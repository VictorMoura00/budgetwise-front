import { Component, NgZone, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MessageService } from 'primeng/api';
import { DashboardService } from '../../core/services/dashboard.service';
import { LayoutService } from '../../core/services/layout.service';
import { LanguageService } from '../../core/services/language.service';
import { TransactionService } from '../../core/services/transaction.service';
import { CategoryService } from '../../core/services/category.service';
import { DashboardData, PeriodMonths } from '../../core/models/dashboard.models';
import { CategoryResponse } from '../../core/models/category.models';
import {
  GetTransactionsParams,
  TransactionResponse,
  TransactionType,
  RecurrenceType,
  PaymentMethod,
} from '../../core/models/transaction.models';

@Component({
  selector: 'app-dashboard',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterLink,
    ChartModule,
    SelectButtonModule,
    SkeletonModule,
    TagModule,
    ButtonModule,
    TooltipModule,
    NgClass,
    DatePipe,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    DatePickerModule,
    ToggleSwitchModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);
  private readonly layout = inject(LayoutService);
  private readonly messageService = inject(MessageService);
  private readonly ngZone = inject(NgZone);

  readonly TransactionType = TransactionType;
  readonly RecurrenceType = RecurrenceType;
  readonly PaymentMethod = PaymentMethod;

  // ─── Dashboard state ────────────────────────────────────────────────────────

  loading = signal(true);
  data = signal<DashboardData | null>(null);
  period = signal<PeriodMonths>(1);
  allCategories = signal<CategoryResponse[]>([]);

  // ─── Pending dialog ─────────────────────────────────────────────────────────

  pendingDialogVisible = false;
  pendingTransactions = signal<TransactionResponse[]>([]);
  loadingPending = signal(false);
  confirming = signal<string | null>(null);

  // ─── Transaction list modal (shared by income/expense/chart clicks) ─────────

  txListVisible = false;
  txListTitle = '';
  txListItems = signal<TransactionResponse[]>([]);
  txListLoading = signal(false);

  // ─── Transaction detail modal ───────────────────────────────────────────────

  txDetailVisible = false;
  selectedTx = signal<TransactionResponse | null>(null);

  // ─── Quick-add dialog ───────────────────────────────────────────────────────

  quickAddVisible = false;
  quickAddSaving = signal(false);

  quickAddForm = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(200)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    type: [TransactionType.Expense, Validators.required],
    transactionDate: [new Date(), Validators.required],
    categoryId: [null as string | null],
    isConfirmed: [false],
  });

  // ─── Computed options ────────────────────────────────────────────────────────

  readonly periodOptions = computed(() => {
    this.lang.currentLang();
    return [
      { label: this.translate.instant('dashboard.period.month'), value: 1 },
      { label: this.translate.instant('dashboard.period.quarter'), value: 3 },
      { label: this.translate.instant('dashboard.period.semester'), value: 6 },
    ];
  });

  readonly typeFormOptions = computed(() => {
    this.lang.currentLang();
    return [
      { label: this.translate.instant('transactions.type.income'), value: TransactionType.Income },
      { label: this.translate.instant('transactions.type.expense'), value: TransactionType.Expense },
    ];
  });

  readonly categoriesOptions = computed(() => {
    const none = { label: this.translate.instant('transactions.form.noCategory'), value: null as string | null };
    return [none, ...this.allCategories().map(c => ({ label: c.name, value: c.id as string | null }))];
  });

  readonly lineChartData = computed(() => {
    const d = this.data();
    if (!d) return null;
    this.lang.currentLang();
    const isDark = this.layout.isDarkMode();
    return {
      labels: d.monthlyEvolution.map(p => p.label),
      datasets: [
        {
          label: this.translate.instant('dashboard.chart.income'),
          data: d.monthlyEvolution.map(p => p.income),
          borderColor: '#22c55e',
          backgroundColor: isDark ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)',
          tension: 0.35,
          fill: true,
          pointRadius: d.monthlyEvolution.length === 1 ? 6 : 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#22c55e',
          borderWidth: 2,
        },
        {
          label: this.translate.instant('dashboard.chart.expense'),
          data: d.monthlyEvolution.map(p => p.expense),
          borderColor: '#f87171',
          backgroundColor: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(248,113,113,0.12)',
          tension: 0.35,
          fill: true,
          pointRadius: d.monthlyEvolution.length === 1 ? 6 : 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#f87171',
          borderWidth: 2,
        },
      ],
    };
  });

  readonly lineChartOptions = computed(() => {
    this.lang.currentLang();
    const isDark = this.layout.isDarkMode();
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)';

    return {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 100,
      interaction: { mode: 'index', intersect: false },
      onClick: (_: any, elements: any[]) => {
        if (elements.length) this.ngZone.run(() => this.onLineChartClick(elements[0].index));
      },
      onHover: (event: any, elements: any[]) => {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, boxWidth: 10, boxHeight: 10, padding: 20, font: { size: 12 } },
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(30,30,35,0.95)' : 'rgba(255,255,255,0.97)',
          titleColor: isDark ? '#fff' : '#111',
          bodyColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx: any) => ` ${this.formatCurrency(ctx.raw)}`,
            footer: () => this.translate.instant('dashboard.chart.clickToView'),
          },
        },
      },
      scales: {
        x: {
          ticks: { color: textColor, font: { size: 11 }, maxRotation: 0 },
          grid: { color: gridColor },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            font: { size: 11 },
            callback: (v: number) => this.formatCurrencyShort(v),
          },
          grid: { color: gridColor },
          border: { display: false },
        },
      },
    };
  });

  readonly donutChartData = computed(() => {
    const d = this.data();
    if (!d || !d.topCategories.length) return null;
    return {
      labels: d.topCategories.map(c => c.categoryName),
      datasets: [{
        data: d.topCategories.map(c => c.total),
        backgroundColor: d.topCategories.map(c => c.color),
        hoverOffset: 6,
        borderWidth: 2,
        borderColor: 'transparent',
      }],
    };
  });

  readonly donutChartOptions = computed(() => {
    this.lang.currentLang();
    const isDark = this.layout.isDarkMode();
    return {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 100,
      cutout: '72%',
      onClick: (_: any, elements: any[]) => {
        if (elements.length) this.ngZone.run(() => this.onDonutChartClick(elements[0].index));
      },
      onHover: (event: any, elements: any[]) => {
        event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(30,30,35,0.95)' : 'rgba(255,255,255,0.97)',
          titleColor: isDark ? '#fff' : '#111',
          bodyColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx: any) => ` ${this.formatCurrency(ctx.raw)}`,
            footer: () => this.translate.instant('dashboard.chart.clickToView'),
          },
        },
      },
    };
  });

  // KPI comparison: delta vs previous period
  readonly incomeComparison = computed(() => this.buildComparison('totalIncome'));
  readonly expenseComparison = computed(() => this.buildComparison('totalExpense'));
  readonly balanceComparison = computed(() => this.buildComparison('balance'));

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.load();
    this.categoryService.getAll({ pageSize: 200 }).subscribe({
      next: res => this.allCategories.set(res.items),
    });
  }

  // ─── Period ─────────────────────────────────────────────────────────────────

  changePeriod(months: PeriodMonths | null): void {
    if (!months) return;
    this.period.set(months);
    this.load();
  }

  // ─── Pending dialog ─────────────────────────────────────────────────────────

  openPendingDialog(): void {
    this.pendingDialogVisible = true;
    this.loadingPending.set(true);

    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();

    this.transactionService.getAll({
      isConfirmed: false,
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${String(lastDay).padStart(2, '0')}`,
      pageSize: 100,
    }).subscribe({
      next: res => {
        this.pendingTransactions.set(res.items);
        this.loadingPending.set(false);
      },
      error: () => this.loadingPending.set(false),
    });
  }

  confirmPendingTransaction(tx: TransactionResponse): void {
    this.confirming.set(tx.id);
    this.transactionService.confirm(tx.id).subscribe({
      next: () => {
        this.pendingTransactions.update(list => list.filter(t => t.id !== tx.id));
        this.confirming.set(null);
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('common.success'),
          detail: this.translate.instant('transactions.toast.confirmSuccess'),
          life: 3000,
        });
        this.load();
      },
      error: () => this.confirming.set(null),
    });
  }

  // ─── Income / Expense KPI modals ────────────────────────────────────────────

  openIncomeModal(): void {
    const { startDate, endDate } = this.periodDateRange();
    this.openTxListModal(
      this.translate.instant('dashboard.modal.incomeTitle'),
      { type: TransactionType.Income, startDate, endDate, pageSize: 200 },
    );
  }

  openExpenseModal(): void {
    const { startDate, endDate } = this.periodDateRange();
    this.openTxListModal(
      this.translate.instant('dashboard.modal.expenseTitle'),
      { type: TransactionType.Expense, startDate, endDate, pageSize: 200 },
    );
  }

  // ─── Chart click handlers ───────────────────────────────────────────────────

  onLineChartClick(index: number): void {
    const today = new Date();
    const months = this.period();
    const date = new Date(today.getFullYear(), today.getMonth() - (months - 1 - index), 1);
    const label = this.data()?.monthlyEvolution[index]?.label ?? '';

    const startDate = this.toDateStr(date);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const endDate = this.toDateStr(lastDay);

    this.openTxListModal(
      this.translate.instant('dashboard.modal.monthTitle', { month: label }),
      { startDate, endDate, pageSize: 200 },
    );
  }

  onDonutChartClick(index: number): void {
    const cat = this.data()?.topCategories[index];
    if (!cat) return;

    const { startDate, endDate } = this.periodDateRange();
    const title = cat.categoryId
      ? this.translate.instant('dashboard.modal.categoryTitle', { name: cat.categoryName })
      : this.translate.instant('dashboard.modal.noCategoryTitle');

    this.openTxListModal(title, {
      type: TransactionType.Expense,
      categoryId: cat.categoryId ?? undefined,
      startDate,
      endDate,
      pageSize: 200,
    });
  }

  // ─── Transaction detail ──────────────────────────────────────────────────────

  openTxDetail(tx: TransactionResponse): void {
    this.selectedTx.set(tx);
    this.txDetailVisible = true;
  }

  paymentMethodLabel(pm: PaymentMethod | null): string {
    if (!pm) return this.translate.instant('transactions.paymentMethod.none');
    const key = {
      [PaymentMethod.Pix]: 'transactions.paymentMethod.pix',
      [PaymentMethod.CreditCard]: 'transactions.paymentMethod.creditCard',
      [PaymentMethod.DebitCard]: 'transactions.paymentMethod.debitCard',
      [PaymentMethod.Cash]: 'transactions.paymentMethod.cash',
      [PaymentMethod.Ted]: 'transactions.paymentMethod.ted',
      [PaymentMethod.Boleto]: 'transactions.paymentMethod.boleto',
      [PaymentMethod.Other]: 'transactions.paymentMethod.other',
    }[pm];
    return key ? this.translate.instant(key) : pm;
  }

  recurrenceLabel(rt: RecurrenceType): string {
    const key = {
      [RecurrenceType.None]: 'transactions.recurrence.none',
      [RecurrenceType.Daily]: 'transactions.recurrence.daily',
      [RecurrenceType.Weekly]: 'transactions.recurrence.weekly',
      [RecurrenceType.Monthly]: 'transactions.recurrence.monthly',
      [RecurrenceType.Yearly]: 'transactions.recurrence.yearly',
    }[rt];
    return key ? this.translate.instant(key) : rt;
  }

  // ─── Quick-add ───────────────────────────────────────────────────────────────

  openQuickAdd(): void {
    this.quickAddForm.reset({
      description: '',
      amount: null,
      type: TransactionType.Expense,
      transactionDate: new Date(),
      categoryId: null,
      isConfirmed: false,
    });
    this.quickAddVisible = true;
  }

  saveQuickAdd(): void {
    if (this.quickAddForm.invalid) {
      this.quickAddForm.markAllAsTouched();
      return;
    }

    const v = this.quickAddForm.value;
    this.quickAddSaving.set(true);

    this.transactionService.create({
      description: v.description!,
      amount: v.amount!,
      type: v.type!,
      transactionDate: this.toDateStr(v.transactionDate as Date)!,
      categoryId: v.categoryId ?? null,
      notes: null,
      recurrenceType: RecurrenceType.None,
      recurrenceEndDate: null,
      isConfirmed: v.isConfirmed ?? false,
      paymentMethod: null,
      familyGroupId: null,
    }).subscribe({
      next: () => {
        this.quickAddSaving.set(false);
        this.quickAddVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('common.success'),
          detail: this.translate.instant('transactions.toast.createSuccess'),
          life: 3000,
        });
        this.load();
      },
      error: () => this.quickAddSaving.set(false),
    });
  }

  // ─── Formatters ─────────────────────────────────────────────────────────────

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  formatCurrencyShort(value: number): string {
    if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
    if (value >= 100) return `R$${Math.round(value)}`;
    if (value > 0) return `R$${value.toFixed(0)}`;
    return 'R$0';
  }

  formatDelta(delta: number): string {
    const abs = this.formatCurrency(Math.abs(delta));
    return delta >= 0 ? `+${abs}` : `-${abs}`;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private openTxListModal(title: string, params: GetTransactionsParams): void {
    this.txListTitle = title;
    this.txListVisible = true;
    this.txListLoading.set(true);
    this.txListItems.set([]);

    this.transactionService.getAll(params).subscribe({
      next: res => {
        this.txListItems.set(res.items);
        this.txListLoading.set(false);
      },
      error: () => this.txListLoading.set(false),
    });
  }

  private periodDateRange(): { startDate: string; endDate: string } {
    const today = new Date();
    const months = this.period();
    const startDate = this.toDateStr(new Date(today.getFullYear(), today.getMonth() - (months - 1), 1))!;
    const endDate = this.toDateStr(today)!;
    return { startDate, endDate };
  }

  private buildComparison(field: 'totalIncome' | 'totalExpense' | 'balance'): string | null {
    const d = this.data();
    if (!d?.prevSummary) return null;
    const curr = d.summary[field];
    const prev = d.prevSummary[field];
    if (prev === 0) return null;
    const delta = curr - prev;
    const pct = Math.round((delta / Math.abs(prev)) * 100);
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${pct}%`;
  }

  private toDateStr(date: Date | null | undefined): string | null {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private load(): void {
    this.loading.set(true);
    this.dashboardService.load(this.period()).subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
