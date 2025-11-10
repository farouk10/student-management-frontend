// src/app/components/user-confirm/user-confirm.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../interfaces/user';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-user-confirm',
  standalone: false,
  templateUrl: './user-confirm.component.html',
  styleUrls: ['./user-confirm.component.scss']
})
export class UserConfirmComponent implements OnInit {
  user: User | null = null;
  userId: string | null = null;
  isLoading = false;
  isDeleting = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.queryParamMap.get('id');
    
    if (this.userId) {
      this.loadUser();
    } else {
      this.toastService.show({
        message: 'Aucun utilisateur spécifié',
        type: 'error',
        duration: 3000
      });
      this.router.navigate(['/admin/users']);
    }
  }

  loadUser(): void {
    if (!this.userId) return;

    this.isLoading = true;
    this.authService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.isLoading = false;
      },
      error: (error) => {
        this.toastService.show({
          message: 'Erreur lors du chargement de l\'utilisateur',
          type: 'error',
          duration: 5000
        });
        this.isLoading = false;
        this.router.navigate(['/admin/users']);
      }
    });
  }

  confirmDelete(): void {
    if (!this.userId || !this.user) return;

    this.isDeleting = true;
    this.authService.deleteUser(this.userId).subscribe({
      next: () => {
        this.toastService.show({
          message: 'Utilisateur supprimé avec succès',
          type: 'success',
          duration: 3000
        });
        this.router.navigate(['/admin/users']);
      },
      error: (error) => {
        let errorMessage = 'Erreur lors de la suppression';
        
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 404) {
          errorMessage = 'Utilisateur non trouvé';
        }

        this.toastService.show({
          message: errorMessage,
          type: 'error',
          duration: 5000
        });
        this.isDeleting = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/users']);
  }

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  get isDeletingSelf(): boolean {
    return this.currentUser?._id === this.userId;
  }
}