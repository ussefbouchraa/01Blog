// Purpose: Main routing configuration for the app.
// Defines top-level routes and lazy-loads feature modules/routes (auth, users, posts, etc.).
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'posts', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'posts',
    loadChildren: () => import('./features/posts/posts.routes').then(m => m.POSTS_ROUTES)
  },
  {
    path: 'users',
    loadChildren: () => import('./features/users/users.routes').then(m => m.USERS_ROUTES),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'posts' }
];
