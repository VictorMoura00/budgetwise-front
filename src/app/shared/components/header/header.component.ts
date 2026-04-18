import { Component, EventEmitter, Output, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { LayoutService } from '../../../core/services/layout.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-header',
  imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    ToolbarModule,
    ButtonModule,
    AvatarModule,
    MenuModule,
    SelectButtonModule,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Output() menuToggle = new EventEmitter<void>();
  private readonly translate = inject(TranslateService);

  readonly auth = inject(AuthService);
  readonly layout = inject(LayoutService);
  readonly lang = inject(LanguageService);

  readonly langOptions = [
    { label: 'PT', value: 'pt' },
    { label: 'EN', value: 'en' },
  ];

  readonly userInitials = computed(() => {
    const name = this.auth.currentUser()?.fullName ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  });

  menuItems = signal<MenuItem[]>([]);

  constructor() {
    effect(() => {
      this.lang.currentLang();
      this.menuItems.set([
        {
          label: this.translate.instant('header.logout'),
          icon: 'pi pi-sign-out',
          command: () => this.auth.logout(),
        },
      ]);
    });
  }
}
