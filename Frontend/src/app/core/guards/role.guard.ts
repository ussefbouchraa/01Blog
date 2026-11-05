// Purpose: Route guard to restrict access to specific roles (e.g., ADMIN).
// Checks user role from AuthService. Redirects unauthorized users to home.
// Note: Backend must also enforce authorization — this guard only controls UI navigation.
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get required roles from route data
  const requiredRoles: string[] = route.data?.['roles'] || [];
  const userRole = authService.getRole();

  // If no roles required, allow
  if (requiredRoles.length === 0) {
    return true;
  }

  // Check if user has at least one required role
  const hasRole = userRole && requiredRoles.some((role) =>
    userRole.toUpperCase().includes(role.toUpperCase())
  );

  if (hasRole) {
    return true;
  }

  // Redirect to home or forbidden page
  return router.createUrlTree(['/']);
};
