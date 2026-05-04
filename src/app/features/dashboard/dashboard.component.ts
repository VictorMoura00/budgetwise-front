import { ChangeDetectionStrategy, Component, DestroyRef, NgZone, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { CategoryService, DashboardService, FamilyGroupService, LanguageService, LayoutService, TransactionService } from '../../core/services';
import {
  CategoryResponse,
  DashboardData,
  DashboardFilterPreset,
  DashboardOverviewResponse,
  DashboardStatusFilter,
  DashboardTypeFilter,
  FamilyGroupSummaryResponse,
  GetTransactionsParams,
  PaymentMethod,
  RecurrenceType,
  TransactionResponse,
  TransactionType,
  calculateDateRange,
} from '../../core/models';
import { TransactionDetailDialogComponent } from './transaction-detail-dialog/transaction-detail-dialog.component';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    TransactionDetailDialogComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly familyGroupService = inject(FamilyGroupService);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);
  private readonly layout = inject(LayoutService);
  private readonly messageService = inject(MessageService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly TransactionType = TransactionType;
  readonly RecurrenceType = RecurrenceType;
  readonly PaymentMethod = PaymentMethod;

  // ─── Filter state ───────────────────────────────────────────────────────────

  filterPreset = signal<DashboardFilterPreset>('thisMonth');
  filterStatus = signal<DashboardStatusFilter>('all');
  filterType = signal<DashboardTypeFilter>('all');
  filterCategoryId = signal<string | null>(null);
  filterFamilyGroupId = signal<string | null>(null);
  filterPaymentMethod = signal<PaymentMethod | null>(null);
  customStartDate = signal<Date | null>(null);
  customEndDate = signal<Date | null>(null);

  allCategories = signal<CategoryResponse[]>([]);
  familyGroups = signal<FamilyGroupSummaryResponse[]>([]);

  // ─── Dashboard state ────────────────────────────────────────────────────────

  loading = signal(true);
  data = signal<DashboardData | null>(null);
  overview = signal<DashboardOverviewResponse | null>(null);

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
  private _quickAddDraft: typeof this.quickAddForm.value | null = null;
  private _quickAddCancelIntent = false;

  quickAddForm = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(200)]],
    amount: [0 as number | null, [Validators.required, Validators.min(0.01)]],
    type: [TransactionType.Expense, Validators.required],
    transactionDate: [new Date(), Validators.required],
    categoryId: [null as string | null],
    isConfirmed: [false],
  });

  // ─── Computed options ────────────────────────────────────────────────────────

  readonly presetOptionsTranslated = signal<{ label: string; value: DashboardFilterPreset }[]>([]);

  private readonly periodLabelKeys = [
    { value: 'thisMonth' as DashboardFilterPreset, labelKey: 'dashboard.filters.thisMonth' },
    { value: 'lastMonth' as DashboardFilterPreset, labelKey: 'dashboard.filters.lastMonth' },
    { value: 'last3Months' as DashboardFilterPreset, labelKey: 'dashboard.filters.last3Months' },
    { value: 'last6Months' as DashboardFilterPreset, labelKey: 'dashboard.filters.last6Months' },
    { value: 'thisYear' as DashboardFilterPreset, labelKey: 'dashboard.filters.thisYear' },
    { value: 'custom' as DashboardFilterPreset, labelKey: 'dashboard.filters.custom' },
  ] as const;

  private rebuildPresetOptions(): void {
    const keys = this.periodLabelKeys.map(x => x.labelKey);
    this.translate.get(keys).subscribe(translations => {
      this.presetOptionsTranslated.set(
        this.periodLabelKeys.map(option => ({
          value: option.value,
          label: translations[option.labelKey] ?? option.labelKey,
        })),
      );
    });
  }

  readonly statusOptions = computed(() => [
    { labelKey: 'common.all', value: 'all' as DashboardStatusFilter },
    { labelKey: 'transactions.status.confirmed', value: 'confirmed' as DashboardStatusFilter },
    { labelKey: 'transactions.status.pending', value: 'pending' as DashboardStatusFilter },
  ]);

  readonly typeOptions = computed(() => [
    { labelKey: 'common.all', value: 'all' as DashboardTypeFilter },
    { labelKey: 'transactions.type.income', value: 'income' as DashboardTypeFilter },
    { labelKey: 'transactions.type.expense', value: 'expense' as DashboardTypeFilter },
  ]);

  readonly paymentMethodOptions = computed(() => [
    { labelKey: 'transactions.paymentMethod.none', value: null as PaymentMethod | null },
    { labelKey: 'transactions.paymentMethod.pix', value: PaymentMethod.Pix },
    { labelKey: 'transactions.paymentMethod.creditCard', value: PaymentMethod.CreditCard },
    { labelKey: 'transactions.paymentMethod.debitCard', value: PaymentMethod.DebitCard },
    { labelKey: 'transactions.paymentMethod.cash', value: PaymentMethod.Cash },
    { labelKey: 'transactions.paymentMethod.ted', value: PaymentMethod.Ted },
    { labelKey: 'transactions.paymentMethod.boleto', value: PaymentMethod.Boleto },
    { labelKey: 'transactions.paymentMethod.other', value: PaymentMethod.Other },
  ]);

  readonly categoryOptions = computed(() => {
    const none = { labelKey: 'common.all' as string | undefined, label: undefined as string | undefined, value: null as string | null };
    return [none, ...this.allCategories().map(c => ({ labelKey: undefined as string | undefined, label: c.name, value: c.id as string | null }))];
  });

  readonly familyGroupOptions = computed(() => {
    const none = { labelKey: 'common.all' as string | undefined, label: undefined as string | undefined, value: null as string | null };
    return [none, ...this.familyGroups().map(g => ({ labelKey: undefined as string | undefined, label: g.name, value: g.id as string | null }))];
  });

  readonly isCustomPreset = computed(() => this.filterPreset() === 'custom');

  readonly currentDateRange = computed(() => {
    const preset = this.filterPreset();
    const start = this.customStartDate();
    const end = this.customEndDate();
    return calculateDateRange(
      preset,
      start ? this.toDateStr(start) ?? undefined : undefined,
      end ? this.toDateStr(end) ?? undefined : undefined,
    );
  });

  readonly overviewCards = computed(() => {
    const ov = this.overview();
    if (!ov) return [];
    return [
      { labelKey: 'dashboard.cards.income', value: ov.financialSummary.totalIncome, type: 'currency' as const },
      { labelKey: 'dashboard.cards.expenses', value: ov.financialSummary.totalExpense, type: 'currency' as const },
      { labelKey: 'dashboard.cards.balance', value: ov.financialSummary.balance, type: 'currency' as const },
      { labelKey: 'dashboard.cards.savingsRate', value: ov.financialSummary.savingsRate, type: 'percentage' as const },
      { labelKey: 'dashboard.cards.confirmedBalance', value: ov.financialSummary.confirmedBalance, type: 'currency' as const },
      { labelKey: 'dashboard.cards.pendingImpact', value: ov.financialSummary.pendingImpact, type: 'currency' as const },
      { labelKey: 'dashboard.cards.projectedBalance', value: ov.financialSummary.projectedBalance, type: 'currency' as const },
    ];
  });

  readonly typeFormOptions = computed(() => [
    { labelKey: 'transactions.type.income', value: TransactionType.Income },
    { labelKey: 'transactions.type.expense', value: TransactionType.Expense },
  ]);

  readonly categoriesChips = computed(() => {
    const none = { labelKey: 'transactions.form.noCategory' as string | undefined, label: undefined as string | undefined, value: null as string | null, icon: null as string | null, color: null as string | null };
    return [none, ...this.allCategories().map(c => ({ labelKey: undefined as string | undefined, label: c.name, value: c.id as string | null, icon: c.icon, color: c.color }))];
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
    this.rebuildPresetOptions();
    this.translate.onLangChange
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rebuildPresetOptions());

    this.applyFilters();
    this.categoryService.getAll({ pageSize: 200 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => this.allCategories.set(res.items),
    });
    this.familyGroupService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => this.familyGroups.set(res),
    });
  }

  // ─── Filter actions ─────────────────────────────────────────────────────────

  changePreset(preset: DashboardFilterPreset | null): void {
    if (!preset) return;
    this.filterPreset.set(preset);
    this.applyFilters();
  }

  changeStatus(status: DashboardStatusFilter | null): void {
    if (!status) return;
    this.filterStatus.set(status);
    this.applyFilters();
  }

  changeType(type: DashboardTypeFilter | null): void {
    if (!type) return;
    this.filterType.set(type);
    this.applyFilters();
  }

  changeCategory(categoryId: string | null): void {
    this.filterCategoryId.set(categoryId);
    this.applyFilters();
  }

  changeFamilyGroup(familyGroupId: string | null): void {
    this.filterFamilyGroupId.set(familyGroupId);
    this.applyFilters();
  }

  changePaymentMethod(paymentMethod: PaymentMethod | null): void {
    this.filterPaymentMethod.set(paymentMethod);
    this.applyFilters();
  }

  onCustomDateChange(): void {
    if (this.filterPreset() === 'custom') {
      this.applyFilters();
    }
  }

  // ─── Pending dialog ─────────────────────────────────────────────────────────

  openPendingDialog(): void {
    this.pendingDialogVisible = true;
    this.loadingPending.set(true);

    const { startDate, endDate } = this.currentDateRange();

    this.transactionService.getAll({
      isConfirmed: false,
      startDate,
      endDate,
      pageSize: 100,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.pendingTransactions.set(res.items);
        this.loadingPending.set(false);
      },
      error: () => this.loadingPending.set(false),
    });
  }

  confirmPendingTransaction(tx: TransactionResponse): void {
    this.confirming.set(tx.id);
    this.transactionService.confirm(tx.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.pendingTransactions.update(list => list.filter(t => t.id !== tx.id));
        this.confirming.set(null);
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('common.success'),
          detail: this.translate.instant('transactions.toast.confirmSuccess'),
          life: 3000,
        });
        this.applyFilters();
      },
      error: () => this.confirming.set(null),
    });
  }

  // ─── Income / Expense KPI modals ────────────────────────────────────────────

  openIncomeModal(): void {
    const { startDate, endDate } = this.currentDateRange();
    this.openTxListModal(
      this.translate.instant('dashboard.modal.incomeTitle'),
      { type: TransactionType.Income, startDate, endDate, pageSize: 200 },
    );
  }

  openExpenseModal(): void {
    const { startDate, endDate } = this.currentDateRange();
    this.openTxListModal(
      this.translate.instant('dashboard.modal.expenseTitle'),
      { type: TransactionType.Expense, startDate, endDate, pageSize: 200 },
    );
  }

  // ─── Chart click handlers ───────────────────────────────────────────────────

  onLineChartClick(index: number): void {
    const { startDate, endDate } = this.currentDateRange();
    const months = this.data()?.monthlyEvolution.length ?? 1;
    const start = new Date(startDate);
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    const label = this.data()?.monthlyEvolution[index]?.label ?? '';

    const monthStart = this.toDateStr(date);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const monthEnd = this.toDateStr(lastDay);

    this.openTxListModal(
      this.translate.instant('dashboard.modal.monthTitle', { month: label }),
      { startDate: monthStart ?? '', endDate: monthEnd ?? '', pageSize: 200 },
    );
  }

  onDonutChartClick(index: number): void {
    const cat = this.data()?.topCategories[index];
    if (!cat) return;

    const { startDate, endDate } = this.currentDateRange();
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

  // ─── Quick-add ───────────────────────────────────────────────────────────────

  openQuickAdd(): void {
    if (this._quickAddDraft) {
      this.quickAddForm.patchValue({
        ...this._quickAddDraft,
        transactionDate: this._quickAddDraft.transactionDate
          ? new Date(this._quickAddDraft.transactionDate as Date)
          : new Date(),
      });
    } else {
      this.quickAddForm.reset({
        description: '',
        amount: 0,
        type: TransactionType.Expense,
        transactionDate: new Date(),
        categoryId: null,
        isConfirmed: false,
      });
    }
    this.quickAddVisible = true;
  }

  cancelQuickAdd(): void {
    this._quickAddCancelIntent = true;
    this.quickAddVisible = false;
  }

  onQuickAddHide(): void {
    if (this._quickAddCancelIntent) {
      this._quickAddDraft = null;
      this._quickAddCancelIntent = false;
      return;
    }
    const v = this.quickAddForm.value;
    const hasData = (v.amount ?? 0) !== 0 || (v.description ?? '') !== '';
    this._quickAddDraft = hasData ? { ...v } : null;
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
      dueDate: null,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.quickAddSaving.set(false);
        this._quickAddDraft = null;
        this.quickAddVisible = false;
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('common.success'),
          detail: this.translate.instant('transactions.toast.createSuccess'),
          life: 3000,
        });
        this.applyFilters();
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

  formatOverviewValue(type: 'currency' | 'percentage', value: number | null): string {
    if (value == null) return '—';
    if (type === 'percentage') return `${value}%`;
    return this.formatCurrency(value);
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private openTxListModal(title: string, params: GetTransactionsParams): void {
    this.txListTitle = title;
    this.txListVisible = true;
    this.txListLoading.set(true);
    this.txListItems.set([]);

    this.transactionService.getAll(params).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.txListItems.set(res.items);
        this.txListLoading.set(false);
      },
      error: () => this.txListLoading.set(false),
    });
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

  private applyFilters(): void {
    this.loading.set(true);
    const { startDate, endDate } = this.currentDateRange();

    const request = {
      startDate,
      endDate,
      status: this.filterStatus(),
      type: this.filterType(),
      categoryId: this.filterCategoryId(),
      familyGroupId: this.filterFamilyGroupId(),
      paymentMethod: this.filterPaymentMethod(),
    };

    this.dashboardService.load(request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.dashboardService.getOverview(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => this.overview.set(res),
      });
  }
}
