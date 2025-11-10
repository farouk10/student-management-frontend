import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ToastService, Toast } from './services/toast.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { SocketService } from './services/socket.service';
import { User } from './interfaces/user';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Student Management Dashboard';
  toasts$: Observable<Toast[]>;
  private destroy$ = new Subject<void>();
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private socketService: SocketService
  ) {
    this.toasts$ = this.toastService.toasts$;

    // On app initialization, check authentication state
    if (!this.authService.isLoggedIn() && this.authService.getToken()) {
      // Token exists but expired
      this.authService.logout();
      this.toastService.show({
        message: 'Session expired, please log in again.',
        type: 'warning',
        duration: 5000
      });
    }
  }

  ngOnInit(): void {
    // Watch authentication state changes
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          // Connect to WebSocket when logged in
          this.socketService.connect();
        } else {
          // Disconnect WebSocket when logged out
          this.socketService.disconnect();
        }
      });

    // If user is already logged in at startup, connect immediately
    if (this.authService.getCurrentUser()) {
      this.socketService.connect();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socketService.disconnect();
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getToastClass(type: string): string {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'primary';
    }
  }

  getToastIcon(type: string): string {
    switch (type) {
      case 'success': return 'bi-check-circle-fill';
      case 'error': return 'bi-exclamation-triangle-fill';
      case 'warning': return 'bi-exclamation-circle-fill';
      case 'info': return 'bi-info-circle-fill';
      default: return 'bi-bell-fill';
    }
  }

  removeToast(toast: Toast): void {
    this.toastService.removeToast(toast);
  }
}
