import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EmptyStateComponent } from '../../shared/components';
import { Observable, forkJoin, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryService, LanguageService, TagService, TransactionService } from '../../core/services';
import { CategoryResponse, PaymentMethod, RecurrenceType, TagResponse, TransactionResponse, TransactionType } from '../../core/models';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TagModule,
    InputTextModule,
    TextareaModule,
    InputNumberModule,
    SelectModule,
    MultiSelectModule,
    SelectButtonModule,
    DatePickerModule,
    ToggleSwitchModule,
    TooltipModule,
    ChipModule,
    DatePipe,
    SkeletonModule,
    EmptyStateComponent,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly tagService = inject(TagService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);

  readonly TransactionType = TransactionType;
  readonly RecurrenceType = RecurrenceType;

  transactions = signal<TransactionResponse[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  saving = signal(false);
  allCategories = signal<CategoryResponse[]>([]);
  allTags = signal<TagResponse[]>([]);

  dialogVisible = false;
  editingTransaction: TransactionResponse | null = null;
  private _draft: typeof this.form.value | null = null;
  private _cancelIntent = false;

  // ─── Bulk selection ─────────────────────────────────────────────────────────

  selectedTransactions = signal<TransactionResponse[]>([]);
  bulkConfirming = signal(false);
  bulkDeleting = signal(false);

  readonly pendingInSelection = computed(() =>
    this.selectedTransactions().filter(t => !t.isConfirmed).length
  );

  // ─── Tag editor modal ────────────────────────────────────────────────────────

  tagEditVisible = false;
  tagEditingTx = signal<TransactionResponse | null>(null);
  tagEditIds = signal<string[]>([]);
  tagSaving = signal(false);
  tagSearchQuery = signal('');

  readonly filteredAvailableTags = computed(() => {
    const q = this.tagSearchQuery().toLowerCase();
    return q
      ? this.allTags().filter(t => t.name.toLowerCase().includes(q))
      : this.allTags();
  });

  filterType = signal<TransactionType | null>(null);
  filterStatus = signal<boolean | null>(null);
  filterDateRange = signal<Date[] | null>(null);

  readonly pageSize = 20;
  readonly skeletonRows = Array(this.pageSize);
  private currentPage = 1;

  // ─── Translated select options (reactive to language changes) ──────────────

  readonly typeFilterOptions = computed<SelectOption<TransactionType | null>[]>(() => {
    this.lang.currentLang();
    return [
      { label: this.translate.instant('common.all'), value: null },
      { label: this.translate.instant('transactions.type.income'), value: TransactionType.Income },
      { label: this.translate.instant('transactions.type.expense'), value: TransactionType.Expense },
    ];
  });

  readonly statusFilterOptions = computed<SelectOption<boolean | null>[]>(() => {
    this.lang.currentLang();
    return [
      { label: this.translate.instant('common.all'), value: null },
      { label: this.translate.instant('transactions.status.confirmed'), value: true },
      { label: this.translate.instant('transactions.status.pending'), value: false },
    ];
  });

  readonly typeFormOptions = computed<SelectOption<TransactionType>[]>(() => {
    this.lang.currentLang();
    return [
      { label: this.translate.instant('transactions.type.income'), value: TransactionType.Income },
      { label: this.translate.instant('transactions.type.expense'), value: TransactionType.Expense },
    ];
  });

  readonly paymentMethodOptions = computed<SelectOption<PaymentMethod | null>[]>(() => {
    this.lang.currentLang();
    return [
      { label: this.translate.instant('transactions.paymentMethod.none'), value: null },
      { label: this.translate.instant('transactions.paymentMethod.pix'), value: PaymentMethod.Pix },
      { label: this.translate.instant('transactions.paymentMethod.creditCard'), value: PaymentMethod.CreditCard },
      { label: this.translate.instant('transactions.paymentMethod.debitCard'), value: PaymentMethod.DebitCard },
      { label: this.translate.instant('transactions.paymentMethod.cash'), value: PaymentMethod.Cash },
      { label: this.translate.instant('transactions.paymentMethod.ted'), value: PaymentMethod.Ted },
      { label: this.translate.instant('transactions.paymentMethod.boleto'), value: PaymentMethod.Boleto },
      { label: this.translate.instant('transactions.paymentMethod.other'), value: PaymentMethod.Other },
    ];
  });

  readonly recurrenceOptions = computed<SelectOption<RecurrenceType>[]>(() => {
    this.lang.currentLang();
    return [
      { label: this.translate.instant('transactions.recurrence.none'), value: RecurrenceType.None },
      { label: this.translate.instant('transactions.recurrence.daily'), value: RecurrenceType.Daily },
      { label: this.translate.instant('transactions.recurrence.weekly'), value: RecurrenceType.Weekly },
      { label: this.translate.instant('transactions.recurrence.monthly'), value: RecurrenceType.Monthly },
      { label: this.translate.instant('transactions.recurrence.yearly'), value: RecurrenceType.Yearly },
    ];
  });

  readonly categoriesOptions = computed<SelectOption<string | null>[]>(() => {
    const noneLabel = this.translate.instant('transactions.form.noCategory');
    return [
      { label: noneLabel, value: null },
      ...this.allCategories().map(c => ({ label: c.name, value: c.id })),
    ];
  });

  readonly tagsOptions = computed<SelectOption<string>[]>(() =>
    this.allTags().map(t => ({ label: t.name, value: t.id }))
  );

  form = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(200)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    type: [TransactionType.Expense, Validators.required],
    transactionDate: [new Date(), Validators.required],
    categoryId: [null as string | null],
    tagIds: [[] as string[]],
    notes: [null as string | null],
    recurrenceType: [RecurrenceType.None],
    recurrenceEndDate: [null as Date | null],
    isConfirmed: [false],
    paymentMethod: [null as PaymentMethod | null],
  });

  constructor() {
    effect(() => { this.lang.currentLang(); });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTags();
    this.loadTransactions(1, this.pageSize);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize)) + 1;
    this.currentPage = page;
    this.loadTransactions(page, event.rows ?? this.pageSize);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadTransactions(1, this.pageSize);
  }

  clearFilters(): void {
    this.filterType.set(null);
    this.filterStatus.set(null);
    this.filterDateRange.set(null);
    this.applyFilters();
  }

  openCreateDialog(): void {
    this.editingTransaction = null;
    if (this._draft) {
      this.form.patchValue({
        ...this._draft,
        transactionDate: this._draft.transactionDate
          ? new Date(this._draft.transactionDate as Date)
          : new Date(),
        recurrenceEndDate: this._draft.recurrenceEndDate
          ? new Date(this._draft.recurrenceEndDate as Date)
          : null,
      });
    } else {
      this.form.reset({
        description: '',
        amount: null,
        type: TransactionType.Expense,
        transactionDate: new Date(),
        categoryId: null,
        tagIds: [],
        notes: null,
        recurrenceType: RecurrenceType.None,
        recurrenceEndDate: null,
        isConfirmed: false,
        paymentMethod: null,
      });
    }
    this.dialogVisible = true;
  }

  cancelDialog(): void {
    this._cancelIntent = true;
    this.dialogVisible = false;
  }

  onDialogHide(): void {
    if (this._cancelIntent) {
      this._draft = null;
      this._cancelIntent = false;
      return;
    }
    if (this.editingTransaction === null) {
      const desc = this.form.value.description ?? '';
      const amount = this.form.value.amount ?? null;
      const hasData = desc !== '' || amount !== null;
      this._draft = hasData ? { ...this.form.value } : null;
    }
  }

  openEditDialog(transaction: TransactionResponse): void {
    this.editingTransaction = transaction;
    this.form.patchValue({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      transactionDate: new Date(transaction.transactionDate),
      categoryId: transaction.categoryId,
      tagIds: transaction.tags.map(t => t.id),
      notes: transaction.notes,
      recurrenceType: transaction.recurrenceType,
      recurrenceEndDate: transaction.recurrenceEndDate ? new Date(transaction.recurrenceEndDate) : null,
      isConfirmed: transaction.isConfirmed,
      paymentMethod: transaction.paymentMethod,
    });
    this.dialogVisible = true;
  }

  saveTransaction(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;
    const transactionDate = this.toDateString(v.transactionDate as Date)!;
    const recurrenceEndDate = this.toDateString(v.recurrenceEndDate as Date | null);
    const selectedTagIds = (v.tagIds as string[]) ?? [];
    const existingTagIds = this.editingTransaction?.tags.map(t => t.id) ?? [];

    this.saving.set(true);

    const save$ = this.editingTransaction
      ? this.transactionService.update(this.editingTransaction.id, {
          description: v.description!,
          amount: v.amount!,
          type: v.type!,
          transactionDate,
          categoryId: v.categoryId ?? null,
          notes: v.notes ?? null,
          recurrenceType: v.recurrenceType ?? RecurrenceType.None,
          recurrenceEndDate,
          paymentMethod: v.paymentMethod ?? null,
          familyGroupId: null,
          dueDate: null,
        })
      : this.transactionService.create({
          description: v.description!,
          amount: v.amount!,
          type: v.type!,
          transactionDate,
          categoryId: v.categoryId ?? null,
          notes: v.notes ?? null,
          recurrenceType: v.recurrenceType ?? RecurrenceType.None,
          recurrenceEndDate,
          isConfirmed: v.isConfirmed ?? false,
          paymentMethod: v.paymentMethod ?? null,
          familyGroupId: null,
          dueDate: null,
        });

    save$.pipe(
      switchMap(transaction => this.syncTags(transaction.id, selectedTagIds, existingTagIds)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.saving.set(false);
        this._draft = null;
        this.dialogVisible = false;
        this.notify('success', this.editingTransaction
          ? 'transactions.toast.updateSuccess'
          : 'transactions.toast.createSuccess');
        this.loadTransactions(this.currentPage, this.pageSize);
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(transaction: TransactionResponse): void {
    this.confirmationService.confirm({
      message: this.translate.instant('transactions.confirmDelete'),
      header: this.translate.instant('transactions.confirmDeleteHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteTransaction(transaction),
    });
  }

  confirmTransaction(transaction: TransactionResponse): void {
    this.confirmationService.confirm({
      message: this.translate.instant('transactions.confirmConfirm'),
      header: this.translate.instant('transactions.confirmConfirmHeader'),
      icon: 'pi pi-check-circle',
      accept: () => this.doConfirmTransaction(transaction),
    });
  }

  // ─── Tag editor ─────────────────────────────────────────────────────────────

  openTagEditor(tx: TransactionResponse): void {
    this.tagEditingTx.set(tx);
    this.tagEditIds.set(tx.tags.map(t => t.id));
    this.tagSearchQuery.set('');
    this.tagEditVisible = true;
  }

  toggleTag(tagId: string): void {
    const current = this.tagEditIds();
    this.tagEditIds.set(
      current.includes(tagId) ? current.filter(id => id !== tagId) : [...current, tagId]
    );
  }

  getTagName(tagId: string): string {
    return this.allTags().find(t => t.id === tagId)?.name ?? tagId;
  }

  saveTagEdit(): void {
    const tx = this.tagEditingTx();
    if (!tx) return;
    this.tagSaving.set(true);
    this.syncTags(tx.id, this.tagEditIds(), tx.tags.map(t => t.id)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.tagSaving.set(false);
        this.tagEditVisible = false;
        this.notify('success', 'transactions.toast.updateSuccess');
        this.loadTransactions(this.currentPage, this.pageSize);
      },
      error: () => this.tagSaving.set(false),
    });
  }

  // ─── Bulk actions ────────────────────────────────────────────────────────────

  bulkConfirmSelected(): void {
    const pending = this.selectedTransactions().filter(t => !t.isConfirmed);
    if (!pending.length) return;
    this.bulkConfirming.set(true);
    forkJoin(pending.map(t => this.transactionService.confirm(t.id))).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.bulkConfirming.set(false);
        this.selectedTransactions.set([]);
        this.notify('success', 'transactions.toast.bulkConfirmSuccess');
        this.loadTransactions(this.currentPage, this.pageSize);
      },
      error: () => this.bulkConfirming.set(false),
    });
  }

  bulkDeleteSelected(): void {
    this.confirmationService.confirm({
      message: this.translate.instant('transactions.confirmBulkDelete', { count: this.selectedTransactions().length }),
      header: this.translate.instant('transactions.confirmDeleteHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.bulkDeleting.set(true);
        forkJoin(this.selectedTransactions().map(t => this.transactionService.delete(t.id))).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.bulkDeleting.set(false);
            this.selectedTransactions.set([]);
            this.notify('success', 'transactions.toast.bulkDeleteSuccess');
            this.loadTransactions(this.currentPage, this.pageSize);
          },
          error: () => this.bulkDeleting.set(false),
        });
      },
    });
  }

  getCategoryName(id: string | null): string {
    if (!id) return '—';
    return this.allCategories().find(c => c.id === id)?.name ?? '—';
  }

  formatAmount(amount: number, type: TransactionType): string {
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
    return type === TransactionType.Income ? `+${formatted}` : `-${formatted}`;
  }

  typeSeverity(type: TransactionType): Severity {
    return type === TransactionType.Income ? 'success' : 'danger';
  }

  statusSeverity(isConfirmed: boolean): Severity {
    return isConfirmed ? 'success' : 'warn';
  }

  hasActiveFilters(): boolean {
    return (
      this.filterType() !== null ||
      this.filterStatus() !== null ||
      (this.filterDateRange()?.length ?? 0) > 0
    );
  }

  get showRecurrenceEndDate(): boolean {
    return this.form.value.recurrenceType !== RecurrenceType.None;
  }

  private syncTags(transactionId: string, selectedIds: string[], existingIds: string[]): Observable<void> {
    const toAdd = selectedIds.filter(id => !existingIds.includes(id));
    const toRemove = existingIds.filter(id => !selectedIds.includes(id));

    const ops: Observable<void>[] = [
      ...toAdd.map(id => this.tagService.addToTransaction(transactionId, id)),
      ...toRemove.map(id => this.tagService.removeFromTransaction(transactionId, id)),
    ];

    return ops.length > 0
      ? forkJoin(ops).pipe(map(() => undefined))
      : of(undefined);
  }

  private loadTransactions(page: number, size: number): void {
    this.loading.set(true);
    this.selectedTransactions.set([]);
    const dateRange = this.filterDateRange();
    this.transactionService.getAll({
      pageNumber: page,
      pageSize: size,
      type: this.filterType(),
      isConfirmed: this.filterStatus(),
      startDate: dateRange?.[0] ? this.toDateString(dateRange[0]) : null,
      endDate: dateRange?.[1] ? this.toDateString(dateRange[1]) : null,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.transactions.set(res.items);
        this.totalRecords.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadCategories(): void {
    this.categoryService.getAll({ pageSize: 200 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => this.allCategories.set(res.items),
    });
  }

  private loadTags(): void {
    this.tagService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: tags => this.allTags.set(tags),
    });
  }

  private deleteTransaction(transaction: TransactionResponse): void {
    this.transactionService.delete(transaction.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify('success', 'transactions.toast.deleteSuccess');
        this.loadTransactions(this.currentPage, this.pageSize);
      },
    });
  }

  private doConfirmTransaction(transaction: TransactionResponse): void {
    this.transactionService.confirm(transaction.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notify('success', 'transactions.toast.confirmSuccess');
        this.loadTransactions(this.currentPage, this.pageSize);
      },
    });
  }

  private toDateString(date: Date | null | undefined): string | null {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private notify(severity: 'success' | 'error', key: string): void {
    this.messageService.add({
      severity,
      summary: this.translate.instant(severity === 'success' ? 'common.success' : 'common.error'),
      detail: this.translate.instant(key),
      life: 3000,
    });
  }
}
