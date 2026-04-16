import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DatePickerModule } from 'primeng/datepicker';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LanguageService } from '../../core/services/language.service';
import { CategoryService } from '../../core/services/category.service';
import { TransactionService } from '../../core/services/transaction.service';
import { CategoryResponse } from '../../core/models/category.models';
import {
  PaymentMethod,
  RecurrenceType,
  TransactionResponse,
  TransactionType,
} from '../../core/models/transaction.models';

type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface SelectOption<T> {
  label: string;
  value: T;
}

@Component({
  selector: 'app-transactions',
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
    SelectButtonModule,
    DatePickerModule,
    ToggleSwitchModule,
    TooltipModule,
    ChipModule,
    DatePipe,
  ],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.scss',
})
export class TransactionsComponent implements OnInit {
  private readonly transactionService = inject(TransactionService);
  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);
  private readonly lang = inject(LanguageService);

  readonly TransactionType = TransactionType;
  readonly RecurrenceType = RecurrenceType;

  transactions = signal<TransactionResponse[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  saving = signal(false);
  allCategories = signal<CategoryResponse[]>([]);

  dialogVisible = false;
  editingTransaction: TransactionResponse | null = null;

  filterType = signal<TransactionType | null>(null);
  filterStatus = signal<boolean | null>(null);
  filterDateRange = signal<Date[] | null>(null);

  readonly pageSize = 20;
  private currentPage = 1;

  // ─── Translated select options (reactive to language changes) ─────────────

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
    const categoryItems = this.allCategories().map(c => ({ label: c.name, value: c.id }));
    return [{ label: noneLabel, value: null }, ...categoryItems];
  });

  form = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(200)]],
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    type: [TransactionType.Expense, Validators.required],
    transactionDate: [new Date(), Validators.required],
    categoryId: [null as string | null],
    notes: [null as string | null],
    recurrenceType: [RecurrenceType.None],
    recurrenceEndDate: [null as Date | null],
    isConfirmed: [false],
    paymentMethod: [null as PaymentMethod | null],
  });

  constructor() {
    // Reload when language changes to ensure computed signals refresh
    effect(() => { this.lang.currentLang(); });
  }

  ngOnInit(): void {
    this.loadCategories();
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
    this.form.reset({
      description: '',
      amount: null,
      type: TransactionType.Expense,
      transactionDate: new Date(),
      categoryId: null,
      notes: null,
      recurrenceType: RecurrenceType.None,
      recurrenceEndDate: null,
      isConfirmed: false,
      paymentMethod: null,
    });
    this.dialogVisible = true;
  }

  openEditDialog(transaction: TransactionResponse): void {
    this.editingTransaction = transaction;
    this.form.patchValue({
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      transactionDate: new Date(transaction.transactionDate),
      categoryId: transaction.categoryId,
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
    const transactionDate = this.toDateString(v.transactionDate as Date);
    const recurrenceEndDate = this.toDateString(v.recurrenceEndDate as Date | null);

    this.saving.set(true);

    const op$ = this.editingTransaction
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
        });

    op$.subscribe({
      next: () => {
        this.saving.set(false);
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

  typeSeverity(type: TransactionType): TagSeverity {
    return type === TransactionType.Income ? 'success' : 'danger';
  }

  statusSeverity(isConfirmed: boolean): TagSeverity {
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

  private loadTransactions(page: number, size: number): void {
    this.loading.set(true);
    const dateRange = this.filterDateRange();
    this.transactionService.getAll({
      pageNumber: page,
      pageSize: size,
      type: this.filterType(),
      isConfirmed: this.filterStatus(),
      startDate: dateRange?.[0] ? this.toDateString(dateRange[0]) : null,
      endDate: dateRange?.[1] ? this.toDateString(dateRange[1]) : null,
    }).subscribe({
      next: res => {
        this.transactions.set(res.items);
        this.totalRecords.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadCategories(): void {
    this.categoryService.getAll({ pageSize: 200 }).subscribe({
      next: res => this.allCategories.set(res.items),
    });
  }

  private deleteTransaction(transaction: TransactionResponse): void {
    this.transactionService.delete(transaction.id).subscribe({
      next: () => {
        this.notify('success', 'transactions.toast.deleteSuccess');
        this.loadTransactions(this.currentPage, this.pageSize);
      },
    });
  }

  private doConfirmTransaction(transaction: TransactionResponse): void {
    this.transactionService.confirm(transaction.id).subscribe({
      next: () => {
        this.notify('success', 'transactions.toast.confirmSuccess');
        this.loadTransactions(this.currentPage, this.pageSize);
      },
    });
  }

  private toDateString(date: Date | null | undefined): string {
    if (!date) return '';
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
