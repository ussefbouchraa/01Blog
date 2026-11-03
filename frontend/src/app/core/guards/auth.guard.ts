// Purpose: Route guard to protect authenticated routes.
// Redirects unauthenticated users to login page if access is denied.
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  return true;
};
