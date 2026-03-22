import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'darkMode';

  isDarkMode = signal(localStorage.getItem(this.STORAGE_KEY) === 'true');

  init(): void {
    this.applyTheme(this.isDarkMode());
  }

  toggleDarkMode(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    localStorage.setItem(this.STORAGE_KEY, String(next));
    this.applyTheme(next);
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.classList.toggle('dark-mode', dark);
  }
}
