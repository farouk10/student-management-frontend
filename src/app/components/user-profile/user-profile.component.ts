//src/app/components/user-profile/user-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { StatsService, UserStats } from '../../services/stats.service';

@Component({
  selector: 'app-user-profile',
  standalone: false,
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  currentUser: User | null = null;
  userStats: UserStats = {};
  isLoading = true;

  constructor(
    private authService: AuthService,
    private statsService: StatsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser) {
      console.log('Current user:', this.currentUser);
      // Load user stats
      this.statsService.loadUserStats();
      this.statsService.userStats$.subscribe(stats => {
        this.userStats = stats;
        this.isLoading = false;
        console.log('User stats loaded:', stats);
      });
    } else {
      console.warn('No current user found');
      this.isLoading = false;
    }
  }

  getAvatarInitials(): string {
    if (!this.currentUser) return '??';
    return (this.currentUser.prenom.charAt(0) + this.currentUser.nom.charAt(0)).toUpperCase();
  }

  getAvatarColor(): string {
    if (!this.currentUser) return '#6c757d';
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const str = this.currentUser._id || this.currentUser.nom + this.currentUser.prenom;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  editProfile(): void {
    this.router.navigate(['/profile/edit']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  getRoleDisplay(): string {
    return this.isAdmin() ? 'Administrateur' : 'Utilisateur';
  }

  getRoleDescription(): string {
    return this.isAdmin() 
      ? 'Accès complet au système de gestion' 
      : 'Accès en lecture seule aux données';
  }

  getShortUserId(): string {
    if (!this.currentUser) return '';
    return this.currentUser._id.substring(0, 8) + '...';
  }
}