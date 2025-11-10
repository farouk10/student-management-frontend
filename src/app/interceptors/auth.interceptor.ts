import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { ToastService } from '../services/toast.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip token check for login/register endpoints
    if (request.url.includes('/api/users/login') || request.url.includes('/api/users/register')) {
      return next.handle(request);
    }

    const token = this.authService.getToken();
    
    if (token) {
      // Check if token is expired before making the request
      if (this.isTokenExpired(token)) {
        this.toastService.show({
          message: 'Session expirée, veuillez vous reconnecter',
          type: 'warning',
          duration: 5000
        });
        this.authService.logout();
        this.router.navigate(['/login']);
        return throwError(() => new Error('Token expired'));
      }

      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.toastService.show({
            message: 'Session expirée, veuillez vous reconnecter',
            type: 'warning',
            duration: 5000
          });
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}