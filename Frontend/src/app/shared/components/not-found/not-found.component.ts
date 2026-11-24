// Purpose: 404 Not Found page.
// Rendered for any URL that does not match a defined route.
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="d-flex flex-column justify-content-center align-items-center text-center py-5">
      <i class="bi bi-exclamation-circle display-1 text-secondary mb-3"></i>
      <div class="display-6 fw-bold text-secondary mb-2">404</div>
      <h1 class="fw-bold mb-2">Page Not Found</h1>
      <p class="text-muted mb-4">The URL you visited does not exist.</p>
      <a routerLink="/home" class="btn btn-primary">
        <i class="bi bi-house me-2"></i>Go Home
      </a>
    </div>
  `,
  styles: []
})
export class NotFoundComponent {}
