// Purpose: Route definitions for the admin feature.
// /admin         → redirects to /admin/users
// /admin/users   → manage users tab
// /admin/posts   → manage posts tab
// /admin/reports → manage reports tab
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'users' },
  {
    path: 'users',
    loadComponent: () =>
      import('./users-tab/users-tab.component').then(m => m.UsersTabComponent)
  },
  {
    path: 'posts',
    loadComponent: () =>
      import('./posts-tab/posts-tab.component').then(m => m.PostsTabComponent)
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports-tab/reports-tab.component').then(m => m.ReportsTabComponent)
  },
  { path: '**', redirectTo: 'users' }
];
