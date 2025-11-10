// src/app/components/navbar/navbar.component.ts
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: false,
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isAdmin = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isAdmin = this.authService.isAdmin();

    // If your AuthService exposes a stream, subscribe to it to react to changes:
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = this.authService.isAdmin();
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getAvatarInitials(): string {
    if (!this.currentUser) return '';
    const p = this.currentUser.prenom || '';
    const n = this.currentUser.nom || '';
    return ((p.charAt(0) || '') + (n.charAt(0) || '')).toUpperCase();
  }

  getAvatarColor(): string {
    if (!this.currentUser) return '#6c757d';
    const id = this.currentUser._id || '';
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    return colors[id.charCodeAt(0) % colors.length];
  }
}
