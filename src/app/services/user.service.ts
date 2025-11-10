// src/app/services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User, RegisterRequest } from '../interfaces/user';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  
  constructor(private authService: AuthService) { }

  getUsers(): Observable<User[]> {
    return this.authService.getUsers();
  }

  getUser(id: string): Observable<User> {
    return this.authService.getUserById(id);
  }

  createUser(userData: RegisterRequest): Observable<User> {
    return this.authService.createUser(userData);
  }

  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.authService.updateUser(id, user);
  }

  deleteUser(id: string): Observable<void> {
    return this.authService.deleteUser(id);
  }
}