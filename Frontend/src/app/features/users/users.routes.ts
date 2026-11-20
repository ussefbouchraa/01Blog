// Purpose: Route definitions for users feature.
// /users/me      → redirects to /users/:actualUserId using current session ID
// /users/me/edit → edit profile page
// /users/:id     → view public user profile (user block page)
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
    canActivate: [meRedirectGuard]
  },
  {
    path: 'me/edit',
    loadComponent: () =>
      import('./edit-profile/edit-profile.component').then(m => m.EditProfileComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./profile/profile.component').then(m => m.ProfileComponent)
  }
];
