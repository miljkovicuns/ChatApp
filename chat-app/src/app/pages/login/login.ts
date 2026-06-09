import {Component, DestroyRef, inject} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Auth} from '../../services/auth';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {NgIf} from '@angular/common';
import {Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NgIf, RouterLink],
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(Auth);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  isLoggingIn = false;
  loginError: string | null = null;

  loginForm = new FormGroup({
    username: new FormControl('', {nonNullable: true, validators: [Validators.required]}),
    password: new FormControl('', {nonNullable: true, validators: [Validators.required]})
  });

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoggingIn = true;
    this.loginError = null;

    const username = this.loginForm.get('username')?.value || '';
    const password = this.loginForm.get('password')?.value || '';

    this.authService.login(username, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isLoggingIn = false;
          console.log('Login successful', response);
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoggingIn = false;
          this.loginError = err.error?.message || 'Login failed';
          console.error('Login error', err);

          this.loginForm.get('password')?.setValue('');
          this.loginForm.get('password')?.markAsUntouched();
          this.loginForm.get('password')?.markAsPristine();

          setTimeout(() => {}, 0);
        }
      });
  }

  clearError() {
    this.loginError = null;
  }

  isFormInvalid(): boolean {
    return this.loginForm.invalid;
  }
}
