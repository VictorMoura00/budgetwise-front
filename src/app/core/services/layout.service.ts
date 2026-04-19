import { Injectable, effect, signal } from '@angular/core';
import { updateSurfacePalette } from '@primeng/themes';

const SURFACE_ZINC = {
  50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7',
  300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a',
  600: '#52525b', 700: '#3f3f46', 800: '#27272a',
  900: '#18181b', 950: '#09090b',
};

const SURFACE_SLATE = {
  50: '#f0f2f5', 100: '#e8edf2', 200: '#d5dce6',
  300: '#b8c4d4', 400: '#8899b0', 500: '#5c6e87',
  600: '#445568', 700: '#2f3e52', 800: '#1a2535',
  900: '#0d1520', 950: '#060b12',
};

@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly STORAGE_KEY = 'budgetwise.darkMode';

  readonly isDarkMode = signal(localStorage.getItem(this.STORAGE_KEY) === 'true');

  constructor() {
    effect(() => {
      const dark = this.isDarkMode();
      document.documentElement.classList.toggle('app-dark', dark);
      localStorage.setItem(this.STORAGE_KEY, String(dark));
      updateSurfacePalette(dark ? SURFACE_ZINC : SURFACE_SLATE);
    });
  }

  toggleDarkMode(): void {
    this.isDarkMode.update(v => !v);
  }
}
