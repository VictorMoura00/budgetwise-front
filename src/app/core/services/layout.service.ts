import { Injectable, effect, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly STORAGE_KEY = 'budgetwise.darkMode';

  readonly isDarkMode = signal(localStorage.getItem(this.STORAGE_KEY) === 'true');

  constructor() {
    effect(() => {
      const dark = this.isDarkMode();
      document.documentElement.classList.toggle('app-dark', dark);
      localStorage.setItem(this.STORAGE_KEY, String(dark));
    });
  }

  toggleDarkMode(): void {
    this.isDarkMode.update(v => !v);
  }
}
