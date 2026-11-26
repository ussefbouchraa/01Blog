// Purpose: Admin route definitions.
// /admin                → single dashboard page (users + posts + reports)
// /admin/users|posts|reports → legacy links redirect back to the dashboard
import { Routes } from '@angular/router';
import { AdminComponent } from './admin.component';

export const ADMIN_ROUTES: Routes = [
  { path: '', component: AdminComponent },
  { path: 'users', pathMatch: 'full', redirectTo: '/admin' },
  { path: 'posts', pathMatch: 'full', redirectTo: '/admin' },
  { path: 'reports', pathMatch: 'full', redirectTo: '/admin' },
  { path: '**', redirectTo: '/admin' }
];
