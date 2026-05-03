import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { SharedExpenseService } from '../../core/services';
import { FamilyGroupService } from '../../core/services';
import { CategoryService } from '../../core/services';
import {
  SharedExpenseResponse,
  SharedExpenseSummaryResponse,
  CreateSharedExpenseRequest,
} from '../../core/models';
import { FamilyMemberResponse } from '../../core/models';
import { CategoryResponse } from '../../core/models';

interface ParticipantFormValue {
  userId: string;
  amountOwed: number | null;
}

@Component({
  selector: 'app-shared-expenses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    InputNumberModule,
    TextareaModule,
    SkeletonModule,
    DatePipe,
  ],
  templateUrl: './shared-expenses.component.html',
  styleUrl: './shared-expenses.component.scss',
})
export class SharedExpensesComponent implements OnInit {
  private readonly service = inject(SharedExpenseService);
  private readonly familyGroupService = inject(FamilyGroupService);
  private readonly categoryService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  groupId = signal<string | null>(null);
  expenses = signal<SharedExpenseResponse[]>([]);
  summary = signal<SharedExpenseSummaryResponse | null>(null);
  loading = signal(false);

  members = signal<FamilyMemberResponse[]>([]);
  categories = signal<CategoryResponse[]>([]);
  loadingMembers = signal(false);
  loadingCategories = signal(false);

  createDialogVisible = signal(false);
  saving = signal(false);

  detailDialogVisible = signal(false);
  detailLoading = signal(false);
  selectedExpense = signal<SharedExpenseResponse | null>(null);

  readonly filteredCategories = computed(() =>
    this.categories().filter(c => c.categoryType === 'Expense' || c.categoryType === 'Both'),
  );

  createForm: FormGroup = this.fb.group({
    description: ['', [Validators.required, Validators.maxLength(255)]],
    totalAmount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    expenseDate: [null as Date | null, Validators.required],
    categoryId: [null as string | null],
    participants: this.fb.array<FormGroup>([], Validators.required),
  });

  get participantsArray(): FormArray<FormGroup> {
    return this.createForm.get('participants') as FormArray<FormGroup>;
  }

  readonly participantError = computed(() => {
    const arr = this.participantsArray;
    if (arr.length === 0) return this.translate.instant('sharedExpenses.errors.noParticipants');
    const values = arr.value as ParticipantFormValue[];
    const userIds = values.map(v => v.userId).filter(Boolean);
    if (new Set(userIds).size !== userIds.length) return this.translate.instant('sharedExpenses.errors.duplicateParticipant');
    const total = values.reduce((sum, v) => sum + (v.amountOwed ?? 0), 0);
    const max = this.createForm.get('totalAmount')?.value ?? 0;
    if (total > max) return this.translate.instant('sharedExpenses.errors.exceedsTotal');
    return null;
  });

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

    this.service.getAll(groupId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.expenses.set(res.items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.service.getSummary(groupId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => this.summary.set(res),
    });
  }

  openCreateDialog(): void {
    this.createForm.reset({
      description: '',
      totalAmount: null,
      expenseDate: null,
      categoryId: null,
      participants: [],
    });
    this.participantsArray.clear();
    this.createDialogVisible.set(true);
    this.loadMembersAndCategories();
  }

  private loadMembersAndCategories(): void {
    const gid = this.groupId();
    if (!gid) return;

    this.loadingMembers.set(true);
    this.loadingCategories.set(true);

    this.familyGroupService.getById(gid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.members.set(res.members);
        this.loadingMembers.set(false);
      },
      error: () => this.loadingMembers.set(false),
    });

    this.categoryService.getAll({ pageNumber: 1, pageSize: 100 }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.categories.set(res.items);
        this.loadingCategories.set(false);
      },
      error: () => this.loadingCategories.set(false),
    });
  }

  addParticipant(): void {
    const group = this.fb.group({
      userId: ['', Validators.required],
      amountOwed: [null as number | null, [Validators.required, Validators.min(0.01)]],
    });
    this.participantsArray.push(group);
  }

  removeParticipant(index: number): void {
    this.participantsArray.removeAt(index);
  }

  saveCreate(): void {
    if (this.createForm.invalid || this.participantError()) return;
    const gid = this.groupId();
    if (!gid) return;

    const raw = this.createForm.value;
    const request: CreateSharedExpenseRequest = {
      description: raw.description.trim(),
      totalAmount: raw.totalAmount,
      expenseDate: this.formatDate(raw.expenseDate),
      categoryId: raw.categoryId || null,
      participants: (raw.participants as ParticipantFormValue[]).map(p => ({
        userId: p.userId,
        amountOwed: p.amountOwed ?? 0,
      })),
    };

    this.saving.set(true);
    this.service.create(gid, request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.createDialogVisible.set(false);
        this.toast('success', 'sharedExpenses.toast.createSuccess');
        this.load(gid);
      },
      error: () => this.saving.set(false),
    });
  }

  openDetail(expense: SharedExpenseResponse): void {
    this.selectedExpense.set(expense);
    this.detailDialogVisible.set(true);
    this.loadDetail(expense.id);
  }

  private loadDetail(expenseId: string): void {
    const gid = this.groupId();
    if (!gid) return;
    this.detailLoading.set(true);
    this.service.getById(gid, expenseId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.selectedExpense.set(res);
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  settle(participant: { userId: string }): void {
    const gid = this.groupId();
    const expense = this.selectedExpense();
    if (!gid || !expense) return;

    this.service.settleParticipant(gid, expense.id, participant.userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast('success', 'sharedExpenses.toast.settleSuccess');
          this.loadDetail(expense.id);
          const gidStr = gid;
          if (gidStr) this.load(gidStr);
        },
      });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private formatDate(date: Date | null): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toast(severity: 'success' | 'error', key: string): void {
    this.messageService.add({
      severity,
      summary: this.translate.instant(severity === 'success' ? 'common.success' : 'common.error'),
      detail: this.translate.instant(key),
      life: 3000,
    });
  }
}
