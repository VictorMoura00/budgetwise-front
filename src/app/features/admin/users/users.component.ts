import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminUserService } from '../../../core/services';
import { AdminUserResponse } from '../../../core/models';

@Component({
  selector: 'app-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslateModule,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    SkeletonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly service = inject(AdminUserService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);
  private readonly fb = inject(FormBuilder);

  users = signal<AdminUserResponse[]>([]);
  totalRecords = signal(0);
  loading = signal(false);

  readonly pageSize = 20;
  readonly skeletonRows = Array(this.pageSize);
  private currentPage = 1;

  editDialogVisible = signal(false);
  editLoading = signal(false);
  editSaving = signal(false);
  editingUser = signal<AdminUserResponse | null>(null);

  editForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  roleDialogVisible = signal(false);
  roleSaving = signal(false);
  roleUser = signal<AdminUserResponse | null>(null);
  selectedRole = signal<string>('');

  readonly roleOptions = [
    { label: 'User', value: 'User' },
    { label: 'Admin', value: 'Admin' },
  ];

  ngOnInit(): void {
    this.loadUsers(1, this.pageSize);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize)) + 1;
    this.currentPage = page;
    this.loadUsers(page, event.rows ?? this.pageSize);
  }

  openEdit(user: AdminUserResponse): void {
    this.editingUser.set(user);
    this.editForm.reset({ fullName: user.fullName, email: user.email });
    this.editDialogVisible.set(true);
    this.loadUserDetail(user.id);
  }

  private loadUserDetail(id: string): void {
    this.editLoading.set(true);
    this.service.getById(id).pipe(takeUntilDestroyed()).subscribe({
      next: res => {
        this.editingUser.set(res);
        this.editForm.patchValue({ fullName: res.fullName, email: res.email });
        this.editLoading.set(false);
      },
      error: () => this.editLoading.set(false),
    });
  }

  saveEdit(): void {
    if (this.editForm.invalid) return;
    const user = this.editingUser();
    if (!user) return;

    this.editSaving.set(true);
    this.service.update(user.id, this.editForm.value).pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.editSaving.set(false);
        this.editDialogVisible.set(false);
        this.toast('success', 'admin.users.toast.updated');
        this.loadUsers(this.currentPage, this.pageSize);
      },
      error: () => this.editSaving.set(false),
    });
  }

  openRoleDialog(user: AdminUserResponse): void {
    this.roleUser.set(user);
    this.selectedRole.set(user.role);
    this.roleDialogVisible.set(true);
  }

  confirmRoleChange(): void {
    const user = this.roleUser();
    if (!user) return;

    this.confirmationService.confirm({
      message: this.translate.instant('admin.users.confirmRoleChange', { name: user.fullName }),
      header: this.translate.instant('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.saveRole(),
    });
  }

  private saveRole(): void {
    const user = this.roleUser();
    if (!user) return;

    this.roleSaving.set(true);
    this.service.updateRole(user.id, { role: this.selectedRole() }).pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.roleSaving.set(false);
        this.roleDialogVisible.set(false);
        this.toast('success', 'admin.users.toast.roleUpdated');
        this.loadUsers(this.currentPage, this.pageSize);
      },
      error: () => this.roleSaving.set(false),
    });
  }

  confirmToggleStatus(user: AdminUserResponse): void {
    this.confirmationService.confirm({
      message: this.translate.instant(user.isActive ? 'admin.users.confirmDeactivate' : 'admin.users.confirmActivate', { name: user.fullName }),
      header: this.translate.instant('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.toggleStatus(user),
    });
  }

  confirmUnlock(user: AdminUserResponse): void {
    this.confirmationService.confirm({
      message: this.translate.instant('admin.users.confirmUnlock', { name: user.fullName }),
      header: this.translate.instant('common.confirm'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.unlock(user),
    });
  }

  private toggleStatus(user: AdminUserResponse): void {
    this.service.toggleStatus(user.id).pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.toast('success', 'admin.users.toast.statusUpdated');
        this.loadUsers(this.currentPage, this.pageSize);
      },
    });
  }

  private unlock(user: AdminUserResponse): void {
    this.service.unlock(user.id).pipe(takeUntilDestroyed()).subscribe({
      next: () => {
        this.toast('success', 'admin.users.toast.unlocked');
        this.loadUsers(this.currentPage, this.pageSize);
      },
    });
  }

  private loadUsers(page: number, size: number): void {
    this.loading.set(true);
    this.service.getAll(page, size).pipe(takeUntilDestroyed()).subscribe({
      next: res => {
        this.users.set(res.items);
        this.totalRecords.set(res.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
