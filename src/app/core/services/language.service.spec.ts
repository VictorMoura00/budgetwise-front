import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';

class MockTranslateService {
  defaultLang = 'pt';
  currentLang = 'pt';
  use(lang: string) { this.currentLang = lang; }
  getBrowserLang() { return 'en'; }
  setDefaultLang(lang: string) { this.defaultLang = lang; }
}

describe('LanguageService', () => {
  let service: LanguageService;
  let translate: MockTranslateService;

  beforeEach(() => {
    translate = new MockTranslateService();
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translate },
      ],
    });
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    localStorage.removeItem('language');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to pt when no saved language and browser lang not available', () => {
    localStorage.removeItem('language');
    translate.getBrowserLang = () => 'fr';
    service.init();
    expect(service.currentLang()).toBe('pt');
  });

  it('should use saved language from localStorage', () => {
    localStorage.setItem('language', 'en');
    service.init();
    expect(service.currentLang()).toBe('en');
  });

  it('should use browser language if available and no saved preference', () => {
    localStorage.removeItem('language');
    translate.getBrowserLang = () => 'zh';
    service.init();
    expect(service.currentLang()).toBe('zh');
  });

  it('should update language and persist to localStorage', () => {
    service.setLanguage('eo');
    expect(service.currentLang()).toBe('eo');
    expect(localStorage.getItem('language')).toBe('eo');
    expect(document.documentElement.lang).toBe('eo');
  });
});
