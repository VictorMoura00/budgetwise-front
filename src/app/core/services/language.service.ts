import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly STORAGE_KEY = 'language';
  readonly available = ['pt', 'en', 'zh', 'eo'] as const;

  currentLang = signal<string>('pt');

  init(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const browser = this.translate.getBrowserLang() ?? 'pt';
    const lang = saved ?? (this.available.includes(browser as typeof this.available[number]) ? browser : 'pt');
    this.setLanguage(lang);
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }
}
