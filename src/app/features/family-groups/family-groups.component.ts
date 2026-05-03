import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { FamilyGroupService } from '../../core/services';
import { FamilyGroupSummaryResponse } from '../../core/models';

@Component({
  selector: 'app-family-groups',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, TranslateModule, ButtonModule, DialogModule, InputTextModule, SkeletonModule, TooltipModule],
  templateUrl: './family-groups.component.html',
  styleUrl: './family-groups.component.scss',
})
export class FamilyGroupsComponent implements OnInit {
  private readonly service = inject(FamilyGroupService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  groups = signal<FamilyGroupSummaryResponse[]>([]);
  loading = signal(false);
  saving = signal(false);

  dialogVisible = false;
  joinDialogVisible = false;
  inviteCode = '';
  groupName = '';
  groupDescription = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.groups.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openCreateDialog(): void {
    this.groupName = '';
    this.groupDescription = '';
    this.dialogVisible = true;
  }

  openJoinDialog(): void {
    this.inviteCode = '';
    this.joinDialogVisible = true;
  }

  createGroup(): void {
    if (!this.groupName.trim()) return;
    this.saving.set(true);
    this.service.create({ name: this.groupName.trim(), description: this.groupDescription || null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.dialogVisible = false;
          this.toast('success', 'familyGroups.toast.createSuccess');
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }

  joinGroup(): void {
    if (!this.inviteCode.trim()) return;
    this.saving.set(true);
    this.service.join({ inviteCode: this.inviteCode.trim() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.joinDialogVisible = false;
          this.toast('success', 'familyGroups.toast.joinSuccess');
          this.load();
        },
        error: () => this.saving.set(false),
      });
  }

  confirmLeave(group: FamilyGroupSummaryResponse): void {
    this.confirmationService.confirm({
      message: this.translate.instant('familyGroups.confirmLeave', { name: group.name }),
      header: this.translate.instant('familyGroups.confirmLeaveHeader'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.service.leave(group.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: () => {
            this.toast('success', 'familyGroups.toast.leaveSuccess');
            this.load();
          },
        });
      },
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
