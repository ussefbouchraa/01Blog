// Purpose: HTTP interceptor to attach JWT token to outgoing requests.
// Adds `Authorization: Bearer <token>` header to all requests going to the API.
// Skips public endpoints (login, register) that don't need auth.

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
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

  // Send request and handle HTTP errors
  return next(authReq).pipe(
    catchError((error) => {
      if (error.status === 401 && token) {
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};
