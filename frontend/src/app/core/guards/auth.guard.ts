// Purpose: Route guard to protect authenticated-only routes.
// Checks if user is logged in via AuthService.
// Redirects to login page if not authenticated.
import { CanActivateFn, Router, Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  } else {
    return router.createUrlTree(['/auth/login']);
  }
};
