import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Solo adjuntar el token a TU API (nunca a terceros)
  const isApi = req.url.startsWith(environment.apiUrl);
  const isLogin = req.url.includes('/auth/google');
  const token = isApi && !isLogin ? auth.getToken() : null;

  const request = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      if (isApi && !isLogin) {
        if (err.status === 401) {
          auth.logout(); // token vencido/revocado/inválido
        } else if (err.status === 403) {
          void router.navigate(['/forbidden']);
        }
      }
      return throwError(() => err);
    })
  );
};