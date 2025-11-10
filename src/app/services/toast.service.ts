import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  public toasts$ = this.toastsSubject.asObservable();

  show(toast: Toast): void {
    const toasts = this.toastsSubject.value;
    this.toastsSubject.next([...toasts, toast]);
    
    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(toast);
    }, toast.duration || 3000);
  }

  removeToast(toast: Toast): void {
    const toasts = this.toastsSubject.value.filter(t => t !== toast);
    this.toastsSubject.next(toasts);
  }

  clear(): void {
    this.toastsSubject.next([]);
  }



  // show(options: ToastOptions): void {
  //   // Your existing toast implementation
  //   console.log(`Toast [${options.type}]: ${options.message}`);
  // }

  // Convenience methods
  showSuccess(message: string, duration: number = 3000): void {
    this.show({ message, type: 'success', duration });
  }

  showError(message: string, duration: number = 5000): void {
    this.show({ message, type: 'error', duration });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.show({ message, type: 'warning', duration });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show({ message, type: 'info', duration });
  }
}



