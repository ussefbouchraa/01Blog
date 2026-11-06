// Purpose: Register page component.
// Handles new user registration form, validation, and calls AuthService to register.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h2 class="card-title text-center mb-4">Register</h2>

            @if (errorMessage) {
              <div class="alert alert-danger py-2" role="alert">{{ errorMessage }}</div>
            }
            @if (successMessage) {
              <div class="alert alert-success py-2" role="alert">{{ successMessage }}</div>
            }

            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="mb-3">
                <label for="username" class="form-label">Username</label>
                <input
                  id="username"
                  type="text"
                  class="form-control"
                  formControlName="username"
                  placeholder="Choose a username"
                  autocomplete="username" />
                @if (form.get('username')?.touched) {
                  @if (form.get('username')?.hasError('required')) {
                    <div class="text-danger small mt-1">Username is required.</div>
                  } @else if (form.get('username')?.hasError('minlength')) {
                    <div class="text-danger small mt-1">Username must be at least 3 characters.</div>
                  }
                }
              </div>

              <div class="mb-3">
                <label for="email" class="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  class="form-control"
                  formControlName="email"
                  placeholder="you@example.com"
                  autocomplete="email" />
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <div class="text-danger small mt-1">A valid email is required.</div>
                }
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  class="form-control"
                  formControlName="password"
                  placeholder="Choose a password"
                  autocomplete="new-password" />
                @if (form.get('password')?.touched) {
                  @if (form.get('password')?.hasError('required')) {
                    <div class="text-danger small mt-1">Password is required.</div>
                  } @else if (form.get('password')?.hasError('minlength')) {
                    <div class="text-danger small mt-1">Password must be at least 6 characters.</div>
                  }
                }
              </div>

              <button type="submit" class="btn btn-primary w-100" [disabled]="form.invalid || loading">
                @if (loading) {
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                }
                Register
              </button>
            </form>

            <p class="text-center mt-3 mb-0">
              Already have an account? <a routerLink="/auth/login" class="text-decoration-none">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { username, email, password } = this.form.value;
    this.auth.register({ username, email, password }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => this.router.navigate(['/auth/login']), 1200);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.status === 400 || err.status === 409
          ? err.error?.message || 'Username or email already taken.'
          : 'Registration failed. Please try again.';
      }
    });
  }
}
