// Purpose: HTTP interceptor to attach JWT token to outgoing requests.
// Also can handle token expiration/refresh logic in the future.
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
