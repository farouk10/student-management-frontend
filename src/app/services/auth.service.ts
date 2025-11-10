// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { User, LoginRequest, RegisterRequest } from '../interfaces/user';
import { ToastService } from './toast.service';
import { environment } from '../../environments/environment';
import { SocketService } from './socket.service';
import { Injector } from '@angular/core';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // private apiUrl = 'http://localhost:3000/api/users';
  private apiUrl = `${environment.apiBaseUrl}/api/users`; // AuthService

  
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenExpirationTimer: any;

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastService: ToastService,
    private injector: Injector
    
  ) {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      // Check if token is still valid
      if (user.token && !this.isTokenExpired(user.token)) {
        this.currentUserSubject.next(user);
        this.autoLogout(user.token);
      } else {
        this.clearStoredAuth();
      }
    }
  }

  

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/login`, credentials).pipe(
      tap(user => {
        this.storeAuthData(user);
        this.autoLogout(user.token);
        this.toastService.show({
          message: 'Connexion réussie!',
          type: 'success',
          duration: 3000
        });
      })
    );
  }

  register(userData: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/register`, userData).pipe(
      tap(user => {
        this.storeAuthData(user);
        this.autoLogout(user.token);
        this.toastService.show({
          message: 'Inscription réussie!',
          type: 'success',
          duration: 3000
        });
      })
    );
  }

  logout(): void {
    try {
      const socketService = this.injector.get(SocketService);
  
      // ✅ First, send the logout signal to the backend
      socketService.emit('logout');
  
      // ✅ Give the backend a short time to process the event before disconnecting
      setTimeout(() => {
        socketService.disconnect();
      }, 300);
    } catch (err) {
      console.warn('Socket logout handling failed:', err);
    }
  
    // Clear session and redirect
    this.clearStoredAuth();
    this.router.navigate(['/login']);
    this.toastService.show({
      message: 'Déconnexion réussie',
      type: 'info',
      duration: 3000
    });
  }
    
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

 // In your AuthService - make sure isAdmin() is implemented like this:
isAdmin(): boolean {
  const user = this.getCurrentUser();
  // console.log('🔍 isAdmin() check - User:', user);
  // console.log('🔍 isAdmin() check - User role:', user?.role);
  return user?.role === 'admin';
}
  updateProfile(profileData: { nom: string; prenom: string; email: string }): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, profileData).pipe(
      tap(user => {
        const currentToken = this.getToken();
        if (currentToken) {
          const updatedUser: User = { 
            ...user, 
            token: currentToken 
          };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
          this.toastService.show({
            message: 'Profil mis à jour avec succès!',
            type: 'success',
            duration: 3000
          });
        } else {
          console.error('No token found during profile update');
          this.logout();
        }
      })
    );
  }

  // New method to get all users (for admin)
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  // New method to get user by ID
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  // New method to create user (for admin)
  // createUser(userData: RegisterRequest): Observable<User> {
  //   return this.http.post<User>(this.apiUrl, userData);
  // }

  createUser(userData: RegisterRequest): Observable<User> {
    const url = `${this.apiUrl}/register`;
    console.log('[AuthService.createUser] POST', url, userData);
    // We intentionally do not `tap` storeAuthData here so the admin's current session isn't overwritten.
    return this.http.post<User>(url, userData);
  }


  // New method to update user (for admin)
  updateUser(id: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData);
  }

  // New method to delete user (for admin)
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private storeAuthData(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', user.token);
    this.currentUserSubject.next(user);
  }

  private clearStoredAuth(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
  }

  private autoLogout(token: string): void {
    // Clear existing timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }

    const expiration = this.getTokenExpiration(token);
    const timeToExpiry = expiration - Date.now();
    
    if (timeToExpiry > 0) {
      this.tokenExpirationTimer = setTimeout(() => {
        this.toastService.show({
          message: 'Session expirée, veuillez vous reconnecter',
          type: 'warning',
          duration: 5000
        });
        this.logout();
      }, timeToExpiry);
    } else {
      // Token already expired
      this.logout();
    }
  }

  private getTokenExpiration(token: string): number {
    try {
      const decoded: any = jwtDecode(token);
      return decoded.exp * 1000; // Convert to milliseconds
    } catch {
      return 0;
    }
  }

  private isTokenExpired(token: string): boolean {
    return this.getTokenExpiration(token) < Date.now();
  }


  // In your AuthService - add this method temporarily
debugCurrentUser(): void {
  const storedUser = localStorage.getItem('currentUser');
  const token = localStorage.getItem('token');
  console.log('🔍 Debug current user:');
  console.log('  - Stored user:', storedUser);
  console.log('  - Token:', token);
  console.log('  - Current user subject:', this.currentUserSubject.value);
  console.log('  - Is logged in:', this.isLoggedIn());
  console.log('  - Is admin:', this.isAdmin());
}
}