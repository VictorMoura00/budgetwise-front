import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService, FamilyGroupService } from '../../../core/services';
import { FamilyGroupResponse, FamilyMemberResponse } from '../../../core/models';

@Component({
  selector: 'app-family-group-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, RouterLink, TranslateModule, ButtonModule, DialogModule, InputTextModule, SkeletonModule, DatePipe],
  templateUrl: './family-group-detail.component.html',
  styleUrl: './family-group-detail.component.scss',
})
export class FamilyGroupDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(FamilyGroupService);
  private readonly auth = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  groupId = signal<string>('');
  group = signal<FamilyGroupResponse | null>(null);
  loading = signal(true);
  saving = signal(false);
  regenerating = signal(false);

  editDialogVisible = false;
  editName = '';
  editDescription = '';

  readonly isOwner = computed(() => {
    const currentUserId = this.auth.currentUser()?.userId;
    const members = this.group()?.members ?? [];
    return members.some(m => m.userId === currentUserId && m.role === 'Owner');
  });

  readonly currentMember = computed(() => {
    const currentUserId = this.auth.currentUser()?.userId;
    return this.group()?.members.find(m => m.userId === currentUserId);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('groupId');
    if (!id) {
      this.router.navigate(['/family-groups']);
      return;
    }
    this.groupId.set(id);
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.service.getById(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.group.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast('error', 'errors.generic');
      },
    });
  }

  openEditDialog(): void {
    const g = this.group();
    if (!g) return;
    this.editName = g.name;
    this.editDescription = g.description ?? '';
    this.editDialogVisible = true;
  }

  saveEdit(): void {
    const id = this.groupId();
    if (!this.editName.trim()) return;
    this.saving.set(true);
    this.service.update(id, { name: this.editName.trim(), description: this.editDescription || null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.saving.set(false);
          this.editDialogVisible = false;
          this.group.set(res);
          this.toast('success', 'familyGroups.toast.updateSuccess');
        },
        error: () => this.saving.set(false),
      });
  }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: this.translate.instant('familyGroups.confirmDelete', { name: this.group()?.name }),
      header: this.translate.instant('common.delete'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.doDelete(),
    });
  }

  private doDelete(): void {
    this.service.delete(this.groupId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast('success', 'familyGroups.toast.deleteSuccess');
        this.router.navigate(['/family-groups']);
      },
    });
  }

  confirmRegenerateInvite(): void {
    this.confirmationService.confirm({
      message: this.translate.instant('familyGroups.confirmRegenerate'),
      header: this.translate.instant('familyGroups.regenerateInvite'),
      icon: 'pi pi-refresh',
      accept: () => this.doRegenerate(),
    });
  }

  private doRegenerate(): void {
    this.regenerating.set(true);
    this.service.regenerateInvite(this.groupId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => {
        this.regenerating.set(false);
        this.group.update(g => g ? { ...g, inviteCode: res.inviteCode } : null);
        this.toast('success', 'familyGroups.toast.regenerateSuccess');
      },
      error: () => this.regenerating.set(false),
    });
  }

  confirmRemoveMember(member: FamilyMemberResponse): void {
    this.confirmationService.confirm({
      message: this.translate.instant('familyGroups.confirmRemoveMember', { name: member.userId }),
      header: this.translate.instant('familyGroups.removeMember'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.doRemoveMember(member.userId),
    });
  }

  private doRemoveMember(userId: string): void {
    this.service.removeMember(this.groupId(), userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast('success', 'familyGroups.toast.removeSuccess');
        this.load(this.groupId());
      },
    });
  }

  confirmLeave(): void {
    this.confirmationService.confirm({
      message: this.translate.instant('familyGroups.confirmLeave', { name: this.group()?.name }),
      header: this.translate.instant('familyGroups.confirmLeaveHeader'),
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.doLeave(),
    });
  }

  private doLeave(): void {
    this.service.leave(this.groupId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast('success', 'familyGroups.toast.leaveSuccess');
        this.router.navigate(['/family-groups']);
      },
    });
  }

  copyInviteCode(): void {
    const code = this.group()?.inviteCode;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      this.toast('success', 'familyGroups.toast.copied');
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
