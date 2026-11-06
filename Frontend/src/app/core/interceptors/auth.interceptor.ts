// Purpose: HTTP interceptor to attach JWT token to outgoing requests.
// Adds `Authorization: Bearer <token>` header to all requests going to the API.
// Skips public endpoints (login, register) that don't need auth.

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const isPublicEndpoint =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register');

  // Attach JWT only to private API requests
  const authReq = token && !isPublicEndpoint
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq);
};
