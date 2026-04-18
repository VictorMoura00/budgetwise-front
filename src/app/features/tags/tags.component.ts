import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TagService } from '../../core/services/tag.service';
import { TagResponse } from '../../core/models/tag.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-tags',
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TooltipModule,
    SkeletonModule,
    EmptyStateComponent,
  ],
  templateUrl: './tags.component.html',
  styleUrl: './tags.component.scss',
})
export class TagsComponent implements OnInit {
  private readonly tagService = inject(TagService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  tags = signal<TagResponse[]>([]);
  loading = signal(false);
  saving = signal(false);
  readonly skeletonTags = Array(8);

  dialogVisible = false;
  editingTag: TagResponse | null = null;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
  });

  ngOnInit(): void {
    this.loadTags();
  }

  openCreateDialog(): void {
    this.editingTag = null;
    this.form.reset({ name: '' });
    this.dialogVisible = true;
  }

  openEditDialog(tag: TagResponse): void {
    this.editingTag = tag;
    this.form.patchValue({ name: tag.name });
    this.dialogVisible = true;
  }

  saveTag(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const name = this.form.value.name!;
    this.saving.set(true);

    const op$ = this.editingTag
      ? this.tagService.update(this.editingTag.id, { name })
      : this.tagService.create({ name });

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.notify('success', this.editingTag ? 'tags.toast.updateSuccess' : 'tags.toast.createSuccess');
        this.loadTags();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(tag: TagResponse): void {
    this.confirmationService.confirm({
      message: this.translate.instant('tags.confirmDelete'),
      header: this.translate.instant('tags.confirmDeleteHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deleteTag(tag),
    });
  }

  private loadTags(): void {
    this.loading.set(true);
    this.tagService.getAll().subscribe({
      next: tags => {
        this.tags.set(tags);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private deleteTag(tag: TagResponse): void {
    this.tagService.delete(tag.id).subscribe({
      next: () => {
        this.notify('success', 'tags.toast.deleteSuccess');
        this.loadTags();
      },
    });
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
