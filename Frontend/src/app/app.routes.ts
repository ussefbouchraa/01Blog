// Purpose: Main routing configuration for the app.
// URL structure:
//   /          → redirects to /home
//   /home      → main feed (PostListComponent) — auth guarded
//   /posts/... → post operations (create, detail, edit) — auth guarded
//   /users/... → user profiles and subscriptions — auth guarded
//   /login     → login page (public)
//   /register  → register page (public)
//   /notifications → notifications page — auth guarded (stub until Task 5.2)
//   /admin     → admin dashboard — auth + role guarded (stub until Task 7.1)
//   /**        → 404 not-found page

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';

export const routes: Routes = [
  // Root redirect → main feed
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public auth routes (login, register)
  ...AUTH_ROUTES,

  // Main feed — /home
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/posts/post-list/post-list.component').then(m => m.PostListComponent)
  },

  // Post operations — /posts/create, /posts/:id, /posts/:id/edit
  {
    path: 'posts',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/posts/posts.routes').then(m => m.POSTS_ROUTES)
  },

  // User profiles — /users/me, /users/:id, /users/me/edit
  {
    path: 'users',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/users/users.routes').then(m => m.USERS_ROUTES)
  },

  // Notifications — /notifications (stub — full implementation in Task 5.2)
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
  },

  // Admin dashboard — /admin (stub — full implementation in Task 7.1)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () =>
      import('./features/admin/admin.component').then(m => m.AdminComponent)
  },

  // 404 — catch all unmatched URLs
  { path: '**', component: NotFoundComponent }
];
