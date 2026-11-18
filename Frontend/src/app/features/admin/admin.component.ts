// Purpose: Admin dashboard — placeholder stub.
// This component will be fully implemented in Task 7.1.
// It exists now so the /admin route resolves without crashing.
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `
    <div class="d-flex flex-column align-items-center text-center py-5">
      <i class="bi bi-shield-lock display-3 text-secondary mb-3"></i>
      <h4 class="text-muted">Admin Dashboard — Coming Soon</h4>
      <p class="text-secondary small">User management, post moderation and reports will appear here.</p>
    </div>
  `,
  styles: []
})
export class AdminComponent {}
