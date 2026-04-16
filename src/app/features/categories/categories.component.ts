import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { ColorPickerModule } from 'primeng/colorpicker';
import { PopoverModule } from 'primeng/popover';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Popover } from 'primeng/popover';
import { ConfirmationService, MessageService } from 'primeng/api';
import { NgClass } from '@angular/common';
import { CategoryService } from '../../core/services/category.service';
import { CategoryResponse } from '../../core/models/category.models';

const ALL_ICONS: string[] = [
  'pi pi-address-book', 'pi pi-at', 'pi pi-ban', 'pi pi-barcode', 'pi pi-bars',
  'pi pi-bell', 'pi pi-bitcoin', 'pi pi-bolt', 'pi pi-book', 'pi pi-bookmark',
  'pi pi-box', 'pi pi-briefcase', 'pi pi-building', 'pi pi-building-columns',
  'pi pi-bullseye', 'pi pi-calculator', 'pi pi-calendar', 'pi pi-calendar-clock',
  'pi pi-calendar-plus', 'pi pi-camera', 'pi pi-car', 'pi pi-cart-plus',
  'pi pi-chart-bar', 'pi pi-chart-line', 'pi pi-chart-pie', 'pi pi-chart-scatter',
  'pi pi-check', 'pi pi-check-circle', 'pi pi-clock', 'pi pi-cloud',
  'pi pi-cloud-download', 'pi pi-cloud-upload', 'pi pi-code', 'pi pi-cog',
  'pi pi-comment', 'pi pi-comments', 'pi pi-compass', 'pi pi-copy',
  'pi pi-credit-card', 'pi pi-crown', 'pi pi-database', 'pi pi-desktop',
  'pi pi-directions', 'pi pi-dollar', 'pi pi-download', 'pi pi-envelope',
  'pi pi-euro', 'pi pi-exclamation-circle', 'pi pi-exclamation-triangle',
  'pi pi-eye', 'pi pi-face-smile', 'pi pi-file', 'pi pi-file-check',
  'pi pi-file-edit', 'pi pi-file-excel', 'pi pi-file-pdf', 'pi pi-filter',
  'pi pi-flag', 'pi pi-folder', 'pi pi-folder-open', 'pi pi-gauge',
  'pi pi-gift', 'pi pi-globe', 'pi pi-graduation-cap', 'pi pi-hammer',
  'pi pi-hashtag', 'pi pi-heart', 'pi pi-history', 'pi pi-home',
  'pi pi-hourglass', 'pi pi-id-card', 'pi pi-image', 'pi pi-inbox',
  'pi pi-indian-rupee', 'pi pi-info', 'pi pi-info-circle', 'pi pi-key',
  'pi pi-language', 'pi pi-lightbulb', 'pi pi-link', 'pi pi-list',
  'pi pi-list-check', 'pi pi-lock', 'pi pi-lock-open', 'pi pi-map',
  'pi pi-map-marker', 'pi pi-megaphone', 'pi pi-microchip', 'pi pi-microphone',
  'pi pi-minus', 'pi pi-minus-circle', 'pi pi-mobile', 'pi pi-money-bill',
  'pi pi-moon', 'pi pi-palette', 'pi pi-paperclip', 'pi pi-pencil',
  'pi pi-pen-to-square', 'pi pi-percentage', 'pi pi-phone', 'pi pi-plus',
  'pi pi-plus-circle', 'pi pi-pound', 'pi pi-power-off', 'pi pi-print',
  'pi pi-receipt', 'pi pi-refresh', 'pi pi-reply', 'pi pi-save',
  'pi pi-search', 'pi pi-send', 'pi pi-server', 'pi pi-share-alt',
  'pi pi-shield', 'pi pi-shop', 'pi pi-shopping-bag', 'pi pi-shopping-cart',
  'pi pi-sign-in', 'pi pi-sign-out', 'pi pi-sitemap', 'pi pi-sliders-h',
  'pi pi-sparkles', 'pi pi-star', 'pi pi-star-fill', 'pi pi-stopwatch',
  'pi pi-sun', 'pi pi-sync', 'pi pi-table', 'pi pi-tablet', 'pi pi-tag',
  'pi pi-tags', 'pi pi-thumbs-down', 'pi pi-thumbs-up', 'pi pi-ticket',
  'pi pi-times', 'pi pi-times-circle', 'pi pi-trash', 'pi pi-trophy',
  'pi pi-truck', 'pi pi-turkish-lira', 'pi pi-undo', 'pi pi-upload',
  'pi pi-user', 'pi pi-user-edit', 'pi pi-user-plus', 'pi pi-users',
  'pi pi-verified', 'pi pi-video', 'pi pi-volume-up', 'pi pi-wallet',
  'pi pi-warehouse', 'pi pi-wave-pulse', 'pi pi-wifi', 'pi pi-wrench',
];

@Component({
  selector: 'app-categories',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    TranslateModule,
    TableModule,
    ButtonModule,
    DialogModule,
    TagModule,
    InputTextModule,
    TextareaModule,
    ConfirmDialogModule,
    TooltipModule,
    ColorPickerModule,
    PopoverModule,
    InputGroupModule,
    InputGroupAddonModule,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit {
  @ViewChild('iconPopover') iconPopover!: Popover;
  @ViewChild('colorPopover') colorPopover!: Popover;

  private readonly categoryService = inject(CategoryService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly translate = inject(TranslateService);

  categories = signal<CategoryResponse[]>([]);
  totalRecords = signal(0);
  loading = signal(false);
  saving = signal(false);

  dialogVisible = false;
  editingCategory: CategoryResponse | null = null;

  readonly pageSize = 10;
  private currentPage = 1;

  iconSearch = '';
  colorPickerValue = 'ffffff';
  displayColor = signal('#FFFFFF');

  readonly allIcons = ALL_ICONS;

  get filteredIcons(): string[] {
    const q = this.iconSearch.toLowerCase().trim();
    if (!q) return this.allIcons;
    return this.allIcons.filter(i => i.replace('pi pi-', '').includes(q));
  }

  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: [null as string | null],
    icon: [null as string | null],
    color: ['#FFFFFF' as string | null],
  });

  ngOnInit(): void {
    this.loadCategories(1, this.pageSize);
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    const page = Math.floor((event.first ?? 0) / (event.rows ?? this.pageSize)) + 1;
    this.currentPage = page;
    this.loadCategories(page, event.rows ?? this.pageSize);
  }

  openCreateDialog(): void {
    this.editingCategory = null;
    this.form.reset({ name: '', description: null, icon: null, color: '#FFFFFF' });
    this.colorPickerValue = 'ffffff';
    this.displayColor.set('#FFFFFF');
    this.iconSearch = '';
    this.dialogVisible = true;
  }

  openEditDialog(category: CategoryResponse): void {
    this.editingCategory = category;
    const color = category.color ?? '#FFFFFF';
    this.colorPickerValue = color.replace('#', '');
    this.displayColor.set(color);
    this.iconSearch = '';
    this.form.patchValue({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color,
    });
    this.dialogVisible = true;
  }

  openIconPicker(event: Event): void {
    this.iconSearch = '';
    this.iconPopover.toggle(event);
  }

  selectIcon(icon: string): void {
    this.form.patchValue({ icon });
    this.iconPopover.hide();
  }

  openColorPicker(event: Event): void {
    this.colorPopover.toggle(event);
  }

  onColorChange(hex: string): void {
    const clean = hex ? hex.replace(/^#/, '') : '';
    this.colorPickerValue = clean;
    const color = clean ? `#${clean}` : null;
    this.form.patchValue({ color });
    this.displayColor.set(color ?? '#FFFFFF');
  }

  saveCategory(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = {
      name: this.form.value.name!,
      description: this.form.value.description || null,
      icon: this.form.value.icon || null,
      color: this.form.value.color || null,
    };

    this.saving.set(true);

    const op$ = this.editingCategory
      ? this.categoryService.update(this.editingCategory.id, request)
      : this.categoryService.create(request);

    op$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogVisible = false;
        this.toast('success', this.editingCategory ? 'categories.toast.updateSuccess' : 'categories.toast.createSuccess');
        this.loadCategories(this.currentPage, this.pageSize);
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDeactivate(category: CategoryResponse): void {
    this.confirmationService.confirm({
      message: this.translate.instant('categories.confirmDeactivate'),
      header: this.translate.instant('categories.confirmDeactivateHeader'),
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deactivate(category),
    });
  }

  iconPreview(value: string | null | undefined): string {
    return value ? value : 'pi pi-tag';
  }

  private deactivate(category: CategoryResponse): void {
    this.categoryService.deactivate(category.id).subscribe({
      next: () => {
        this.toast('success', 'categories.toast.deactivateSuccess');
        this.loadCategories(this.currentPage, this.pageSize);
      },
    });
  }

  private loadCategories(page: number, size: number): void {
    this.loading.set(true);
    this.categoryService.getAll({ pageNumber: page, pageSize: size }).subscribe({
      next: res => {
        this.categories.set(res.items);
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
