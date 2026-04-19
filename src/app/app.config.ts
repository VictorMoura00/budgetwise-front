import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { tokenRefreshInterceptor } from './core/interceptors/token-refresh.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { providePrimeNG } from 'primeng/config';
import { ConfirmationService, MessageService } from 'primeng/api';
import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';
import { routes } from './app.routes';

// Apenas sobrescreve light.surface para reduzir o branco excessivo.
// O dark.surface do Aura (surface-0 = #fff, surface-950 = zinc.950) é preservado
// intencionalmente — os mapeamentos semânticos do Aura dependem dessa escala.
const AppPreset = definePreset(Aura, {
  semantic: {
    colorScheme: {
      light: {
        surface: {
          0:   '#eef1f5',
          50:  '#dde3ea',
          100: '#cdd5de',
          200: '#b0becb',
          300: '#8ea3b5',
          400: '#6a8899',
          500: '#4a6a7c',
          600: '#345060',
          700: '#213847',
          800: '#12222e',
          900: '#091219',
          950: '#040a0f',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor, authInterceptor, tokenRefreshInterceptor])),
    provideAnimationsAsync(),
    provideTranslateService({ defaultLanguage: 'pt' }),
    provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    providePrimeNG({
      ripple: true,
      inputVariant: 'outlined',
      theme: {
        preset: AppPreset,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    }),
    MessageService,
    ConfirmationService,
  ],
};
