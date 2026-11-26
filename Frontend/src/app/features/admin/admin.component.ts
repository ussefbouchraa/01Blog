// Purpose: Admin dashboard — one page with users, posts and reports together.
// Access is restricted by authGuard + roleGuard in app.routes.ts.
import { Component } from '@angular/core';
import { UsersTabComponent } from './users-tab/users-tab.component';
import { PostsTabComponent } from './posts-tab/posts-tab.component';
import { ReportsTabComponent } from './reports-tab/reports-tab.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [UsersTabComponent, PostsTabComponent, ReportsTabComponent],
  template: `
    <div class="container-fluid py-3 admin-page">
      <div class="admin-heading">
        <div class="admin-heading-icon"><i class="bi bi-shield-lock-fill"></i></div>
        <div>
          <h2 class="mb-1">Admin Dashboard</h2>
          <p class="mb-0">Manage users, moderate posts and review reports.</p>
        </div>
      </div>

      <app-users-tab class="d-block mb-4"></app-users-tab>
      <app-posts-tab class="d-block mb-4"></app-posts-tab>
      <app-reports-tab class="d-block"></app-reports-tab>
    </div>
  `,
  styles: []
})
export class AdminComponent {}
