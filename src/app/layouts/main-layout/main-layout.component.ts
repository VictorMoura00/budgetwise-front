import { Component, HostListener, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { HeaderComponent } from '../../shared/components/header/header.component';

const MOBILE_BP = 768;

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, TranslateModule, HeaderComponent, ToastModule, ConfirmDialogModule],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  readonly isMobile = signal(window.innerWidth <= MOBILE_BP);
  sidebarOpen = signal(window.innerWidth > MOBILE_BP);

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth <= MOBILE_BP);
  }

  toggle(): void {
    this.sidebarOpen.update(v => !v);
  }

  close(): void {
    this.sidebarOpen.set(false);
  }

  closeIfMobile(): void {
    if (this.isMobile()) this.close();
  }
}
