// Purpose: Route definitions for users feature.
// /users/me  → redirects to /users/:actualUserId using current session ID
// /users/:id → view public user profile (user block page)
// Profile editing is handled in place by a modal, so no edit route is needed.
import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export const meRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userId = authService.getUserId();

  if (userId) {
    return router.createUrlTree(['/users', userId]);
  }
  return router.createUrlTree(['/login']);
};

export const USERS_ROUTES: Routes = [
  {
    path: 'me',
    canActivate: [meRedirectGuard],
    loadComponent: () =>
      import('./profile/profile.component').then(m => m.ProfileComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./profile/profile.component').then(m => m.ProfileComponent)
  }
];
