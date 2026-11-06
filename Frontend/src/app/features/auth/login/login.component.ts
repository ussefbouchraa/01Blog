// Purpose: Login page component.
// Handles user authentication form, validation, and calls AuthService to login.
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="row justify-content-center">
      <div class="col-md-6 col-lg-5">
        <div class="card shadow-sm">
          <div class="card-body p-4">
            <h2 class="card-title text-center mb-4">Login</h2>

            @if (errorMessage) {
              <div class="alert alert-danger py-2" role="alert">{{ errorMessage }}</div>
            }

            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="mb-3">
                <label for="usernameOrEmail" class="form-label">Username or Email</label>
                <input
                  id="usernameOrEmail"
                  type="text"
                  class="form-control"
                  formControlName="usernameOrEmail"
                  placeholder="Enter your username or email"
                  autocomplete="username" />
                @if (form.get('usernameOrEmail')?.invalid && form.get('usernameOrEmail')?.touched) {
                  <div class="text-danger small mt-1">Username or email is required.</div>
                }
              </div>

              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  class="form-control"
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="current-password" />
                @if (form.get('password')?.invalid && form.get('password')?.touched) {
                  <div class="text-danger small mt-1">Password is required.</div>
                }
              </div>

              <button type="submit" class="btn btn-primary w-100" [disabled]="form.invalid || loading">
                @if (loading) {
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                }
                Login
              </button>
            </form>

            <p class="text-center mt-3 mb-0">
              Don't have an account? <a routerLink="/auth/register" class="text-decoration-none">Register</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    this.errorMessage = '';

    const { usernameOrEmail, password } = this.form.value;
    this.auth.login({ usernameOrEmail, password }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.status === 401 || err.status === 400
          ? 'Invalid username/email or password.'
          : err.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
