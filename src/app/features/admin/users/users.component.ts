import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AdminUserService } from '../../../core/services';
import { AdminUserResponse } from '../../../core/models';

@Component({
  selector: 'app-admin-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TableModule, ButtonModule, TagModule, TooltipModule, SkeletonModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private readonly service = inject(AdminUserService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  users = signal<AdminUserResponse[]>([]);
  totalRecords = signal(0);
  loading = signal(false);

  readonly pageSize = 20;
  readonly skeletonRows = Array(this.pageSize);
  private currentPage = 1;

  ngOnInit(): void {
    this.loadUsers(1, this.pageSize);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize)) + 1;
    this.currentPage = page;
    this.loadUsers(page, event.rows ?? this.pageSize);
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
