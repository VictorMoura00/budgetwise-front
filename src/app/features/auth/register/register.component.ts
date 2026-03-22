import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ValidationErrors, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { ThemeService } from '../../../core/services/theme.service';
import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly theme = inject(ThemeService);
  readonly lang = inject(LanguageService);

  readonly langOptions = [
    { label: 'PT', value: 'pt' },
    { label: 'EN', value: 'en' },
  ];

  form = this.fb.group(
    {
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordMatchValidator },
  );

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
      .register({
        fullName: this.form.value.fullName!,
        email: this.form.value.email!,
        password: this.form.value.password!,
        confirmPassword: this.form.value.confirmPassword!,
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.errorKey.set(
            err.status === 409 ? 'errors.emailConflict' : 'errors.generic',
          );
        },
      });
  }
}
