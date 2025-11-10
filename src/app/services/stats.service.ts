import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { EtudiantService } from './etudiant.service';
import { AuthService } from './auth.service';
import { jwtDecode } from 'jwt-decode';

export interface UserStats {
  totalStudents?: number;
  totalSubjects?: number;
  lastLogin?: string;
  accountAge?: string;
  accountCreation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private userStatsSubject = new BehaviorSubject<UserStats>({});
  public userStats$ = this.userStatsSubject.asObservable();

  constructor(
    private etudiantService: EtudiantService,
    private authService: AuthService
  ) {}

  loadUserStats(): void {
    const user = this.authService.getCurrentUser();
    if (!user) {
      console.warn('No current user found for stats');
      return;
    }

    const stats: UserStats = {};

    try {
      // Calculate account age and format creation date
      if (user.createdAt) {
        const created = new Date(user.createdAt);
        const now = new Date();
        
        // Calculate account age in days
        const diffTime = Math.abs(now.getTime() - created.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        stats.accountAge = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
        
        // Format creation date
        stats.accountCreation = this.formatDate(created);
      } else {
        stats.accountAge = 'Non disponible';
        stats.accountCreation = 'Non disponible';
      }

      // Get last login from token issued at time
      const token = this.authService.getToken();
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          const issuedAt = new Date(decoded.iat * 1000);
          stats.lastLogin = this.formatDate(issuedAt);
        } catch (error) {
          console.warn('Could not decode token for last login:', error);
          stats.lastLogin = 'Récemment';
        }
      }

      // Load student statistics (for admin users)
      if (this.authService.isAdmin()) {
        this.etudiantService.getAllEtudiants(1, 1000).subscribe({
          next: (response) => {
            stats.totalStudents = response.pagination.totalItems;
            
            // Calculate unique subjects from all students
            const allSubjects = new Set<string>();
            response.etudiants.forEach(etudiant => {
              etudiant.matiere.forEach(matiere => allSubjects.add(matiere));
            });
            stats.totalSubjects = allSubjects.size;
            
            this.userStatsSubject.next(stats);
          },
          error: (error) => {
            console.error('Error loading user stats:', error);
            // Still set the basic stats even if student stats fail
            this.userStatsSubject.next(stats);
          }
        });
      } else {
        this.userStatsSubject.next(stats);
      }
    } catch (error) {
      console.error('Error in loadUserStats:', error);
      this.userStatsSubject.next({
        accountAge: 'Erreur',
        accountCreation: 'Erreur',
        lastLogin: 'Erreur'
      });
    }
  }

  getUserStats(): UserStats {
    return this.userStatsSubject.value;
  }

  private formatDate(date: Date): string {
    try {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  }
}