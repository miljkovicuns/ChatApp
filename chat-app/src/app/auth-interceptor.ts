import { HttpInterceptorFn } from '@angular/common/http';
import {Auth} from './services/auth';
import {inject} from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const authService = inject(Auth);
  const token = authService.getToken();
  console.log('Token being sent:', token ? 'Yes (length: ' + token.length + ')' : 'No');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
