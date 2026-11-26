// Purpose: Admin dashboard shell.
// Renders the section header, Bootstrap tabs (Users · Posts · Reports) and the
// routed tab content. Access is restricted by authGuard + roleGuard in app.routes.ts.
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="row justify-content-center">
      <div class="col-lg-11">
        <!-- Dashboard header -->
        <div class="mb-4">
          <h2 class="h4 fw-bold mb-1 d-flex align-items-center">
            <i class="bi bi-shield-lock-fill me-2 text-danger"></i>Admin Dashboard
          </h2>
          <p class="text-muted small mb-0">
            Manage users, moderate posts and review reports.
          </p>
        </div>

        <!-- Section tabs -->
        <ul class="nav nav-tabs mb-4" role="tablist">
          <li class="nav-item" role="presentation">
            <a
              class="nav-link d-flex align-items-center"
              routerLink="/admin/users"
              routerLinkActive="active">
              <i class="bi bi-people me-2"></i>Users
            </a>
          </li>
          <li class="nav-item" role="presentation">
            <a
              class="nav-link d-flex align-items-center"
              routerLink="/admin/posts"
              routerLinkActive="active">
              <i class="bi bi-file-earmark-text me-2"></i>Posts
            </a>
          </li>
          <li class="nav-item" role="presentation">
            <a
              class="nav-link d-flex align-items-center"
              routerLink="/admin/reports"
              routerLinkActive="active">
              <i class="bi bi-flag me-2"></i>Reports
            </a>
          </li>
        </ul>

        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: []
})
export class AdminComponent {}
