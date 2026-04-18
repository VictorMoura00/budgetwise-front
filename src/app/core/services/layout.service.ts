import { Injectable, effect, signal } from '@angular/core';
import { updateSurfacePalette } from '@primeng/themes';

const SURFACE_ZINC = {
  50: '#fafafa', 100: '#f4f4f5', 200: '#e4e4e7',
  300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a',
  600: '#52525b', 700: '#3f3f46', 800: '#27272a',
  900: '#18181b', 950: '#09090b',
};

const SURFACE_SLATE = {
  50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0',
  300: '#cbd5e1', 400: '#94a3b8', 500: '#64748b',
  600: '#475569', 700: '#334155', 800: '#1e293b',
  900: '#0f172a', 950: '#020617',
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
