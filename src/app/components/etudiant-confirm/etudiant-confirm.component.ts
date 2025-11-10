//src/app/components/etudiant-confirm/etudiant-confirm.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EtudiantService } from '../../services/etudiant.service';
import { Etudiant, EtudiantCreate } from '../../interfaces/etudiant';

@Component({
  selector: 'app-etudiant-confirm',
  standalone: false,
  templateUrl: './etudiant-confirm.component.html',
  styleUrls: ['./etudiant-confirm.component.scss']
})
export class EtudiantConfirmComponent implements OnInit {
  etudiantData: EtudiantCreate | null = null;
  isLoading = false;
  errorMessage = '';
  isEditing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private etudiantService: EtudiantService
  ) {}

  ngOnInit(): void {
    // Try multiple ways to get the data
    const navigation = this.router.getCurrentNavigation();
    
    if (navigation?.extras.state) {
      this.etudiantData = navigation.extras.state['etudiantData'];
      console.log('Data from navigation state:', this.etudiantData);
    } else {
      // Alternative: check browser history state
      const historyState = window.history.state;
      if (historyState && historyState.etudiantData) {
        this.etudiantData = historyState.etudiantData;
        console.log('Data from history state:', this.etudiantData);
      } else {
        console.error('No student data found, redirecting...');
        this.router.navigate(['/etudiants/new']);
      }
    }
  }
  
  startEditing(): void {
    this.isEditing = true;
  }

  cancelEditing(): void {
    this.isEditing = false;
  }

  onStudentUpdated(updatedData: EtudiantCreate): void {
    this.etudiantData = updatedData;
    this.isEditing = false;
  }

  confirmAndAdd(): void {
    if (!this.etudiantData) return;
  
    this.isLoading = true;
    this.errorMessage = '';
  
    // Check if we have an existing student (has id)
    const hasId = (this.etudiantData as any).id !== undefined;
  
    if (hasId) {
      // UPDATE EXISTING STUDENT
      const id = (this.etudiantData as any).id;
  
      this.etudiantService.updateEtudiant(id, this.etudiantData).subscribe({
        next: (updatedEtudiant) => {
          this.isLoading = false;
          this.router.navigate(['/etudiants'], {
            queryParams: { message: 'Étudiant modifié avec succès' }
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Erreur lors de la mise à jour de l\'étudiant';
        }
      });
  
    } else {
      // CREATE NEW STUDENT
      this.etudiantService.createEtudiant(this.etudiantData).subscribe({
        next: (newEtudiant) => {
          this.isLoading = false;
          this.router.navigate(['/etudiants'], {
            queryParams: { message: 'Étudiant ajouté avec succès' }
          });
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Erreur lors de l\'ajout de l\'étudiant';
        }
      });
    }
  }
  

  cancelAndGoBack(): void {
    this.router.navigate(['/etudiants/new']);
  }

  getAvatarInitials(): string {
    if (!this.etudiantData) return '??';
    return (this.etudiantData.prenom.charAt(0) + this.etudiantData.nom.charAt(0)).toUpperCase();
  }

  getAvatarColor(): string {
    if (!this.etudiantData) return '#6c757d';
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    // Use name for color generation since we don't have ID yet
    const str = this.etudiantData.nom + this.etudiantData.prenom;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
}