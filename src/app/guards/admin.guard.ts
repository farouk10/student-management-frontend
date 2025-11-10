// src/app/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    const isLoggedIn = this.authService.isLoggedIn();
    const isAdmin = this.authService.isAdmin();
    
    console.log('🛡️ AdminGuard checking:');
    console.log('  - isLoggedIn:', isLoggedIn);
    console.log('  - isAdmin:', isAdmin);
    console.log('  - Current user:', this.authService.getCurrentUser());
    
    if (isLoggedIn && isAdmin) {
      console.log('✅ AdminGuard: Access granted');
      return true;
    } else {
      console.log('❌ AdminGuard: Access denied - redirecting to dashboard');
      this.router.navigate(['/dashboard']);
      return false;
    }
  }
}