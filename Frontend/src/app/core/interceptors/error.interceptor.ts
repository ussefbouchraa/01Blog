// Purpose: Global HTTP error interceptor.
// Maps API error status codes to readable messages, shows them as alerts,
// and forces logout + redirect to login on 401. Errors are still re-thrown
// so components can react (e.g. inline form errors on login/register).
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

// Default messages for HTTP errors
const ERROR_MESSAGES: Record<number, string> = {
  400: 'The request was invalid. Please check your input.',
  401: 'You must be logged in to do that.',
  403: 'You do not have permission to do that.',
  404: 'The requested resource was not found.',
  409: 'That conflicts with existing data (already taken?).',
  429: 'Too many requests. Please slow down.',
  500: 'Server error. Please try again later.'
};

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const notifications = inject(NotificationService);
  const router = inject(Router);

  // Skip global error notifications for login/register requests
  const isAuthReq = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let message: string;

      if (error.status === 0) {
        message = 'Cannot reach the server. Is the backend running?';
      } else {
        const serverMessage = error.error?.message || error.error?.error;

        message = serverMessage ||
          ERROR_MESSAGES[error.status] ||
          `Request failed (${error.status}).`;
      }

      // Logout when an authenticated request returns 401
      if (error.status === 401 && auth.getToken() && !isAuthReq) {
        auth.logout();
        message = 'Your session has expired. Please login again.';
        router.navigate(['/login']);
      }

      // Show notifications for non-auth requests
      if (!isAuthReq) {
        notifications.error(message);
      }

      // Allow components to handle their own errors
      return throwError(() => error);
    })
  );
};
