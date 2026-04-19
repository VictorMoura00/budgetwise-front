import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageModule } from 'primeng/message';
import { NgClass } from '@angular/common';
import { AuthService, LanguageService, LayoutService } from '../../../core/services';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    RouterLink,
    TranslateModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    FloatLabelModule,
    SelectButtonModule,
    MessageModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly layout = inject(LayoutService);
  readonly lang = inject(LanguageService);

  readonly langOptions = [
    { label: 'PT', value: 'pt' },
    { label: 'EN', value: 'en' },
  ];

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  isLoading = signal(false);
  errorKey = signal<string | null>(null);

  onLangChange(value: string): void {
    this.lang.setLanguage(value);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorKey.set(null);

    this.auth
      .login({
        email: this.form.value.email!,
        password: this.form.value.password!,
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorKey.set(
            err.status === 401 ? 'errors.invalidCredentials' : 'errors.generic',
          );
        },
      });
  }
}
