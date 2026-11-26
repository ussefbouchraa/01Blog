// Purpose: Main routing configuration for the app.
// URL structure:
//   /          → redirects to /home
//   /home      → main feed (PostListComponent) — auth guarded
//   /posts/... → post operations (create, detail, edit) — auth guarded
//   /users/... → user profiles and subscriptions — auth guarded
//   /login     → login page (public)
//   /register  → register page (public)
//   /admin     → admin dashboard (Users · Posts · Reports) — auth + role guarded
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

  // Admin dashboard — /admin (auth + ROLE_ADMIN only)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },

  // 404 — catch all unmatched URLs
  { path: '**', component: NotFoundComponent }
];
