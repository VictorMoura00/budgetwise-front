import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-category-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div
      class="category-icon"
      [style.background-color]="color() ?? 'var(--p-primary-100)'"
    >
      <i [class]="icon() ?? 'pi pi-tag'"></i>
    </div>
  `,
  styles: [`
    .category-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 0.875rem;
      flex-shrink: 0;
    }
  `],
})
export class CategoryIconComponent {
  icon = input<string | null>();
  color = input<string | null>();
}
