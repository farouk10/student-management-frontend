import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { EtudiantService } from '../../services/etudiant.service';
import { AuthService } from '../../services/auth.service';
import { Etudiant, PaginatedResponse } from '../../interfaces/etudiant';

@Component({
  selector: 'app-etudiant-list',
  standalone:false,
  templateUrl: './etudiant-list.component.html',
  styleUrls: ['./etudiant-list.component.scss']
})
export class EtudiantListComponent implements OnInit {
  etudiants: Etudiant[] = [];
  isLoading = true;
  errorMessage = '';
  searchTerm = '';
  selectedStudent: Etudiant | null = null;
  expandedMatieres: Set<number> = new Set();

  // Pagination properties
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  totalItems = 0;
  hasNext = false;
  hasPrev = false;

  // Search debounce
  private searchSubject = new Subject<string>();

  constructor(
    private etudiantService: EtudiantService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEtudiants();
    
    // Setup search debounce (300ms delay after user stops typing)
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadEtudiants(): void {
    this.isLoading = true;
    this.etudiantService.getAllEtudiants(this.currentPage, this.itemsPerPage, this.searchTerm).subscribe({
      next: (response: PaginatedResponse<Etudiant>) => {
        this.etudiants = response.etudiants;
        this.currentPage = response.pagination.currentPage;
        this.totalPages = response.pagination.totalPages;
        this.totalItems = response.pagination.totalItems;
        this.hasNext = response.pagination.hasNext;
        this.hasPrev = response.pagination.hasPrev;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des étudiants';
        this.isLoading = false;
        console.error('Error loading students:', error);
      }
    });
  }

  
  onSearchInput(): void {
    // Trigger search with debounce
    this.searchSubject.next(this.searchTerm);
  }

  onSearch(): void {
    // Immediate search (when user presses enter or clicks search button)
    this.performSearch(this.searchTerm);
  }

  private performSearch(searchTerm: string): void {
    // Reset to first page when searching
    this.currentPage = 1;
    this.loadEtudiants();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadEtudiants();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadEtudiants();
      this.selectedStudent = null; // Reset selection when changing pages
    }
  }

  nextPage(): void {
    if (this.hasNext) {
      this.goToPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.hasPrev) {
      this.goToPage(this.currentPage - 1);
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }
  
  // NEW: Helper methods to check if we should show first/last page links
  shouldShowFirstPage(): boolean {
    const pageNumbers = this.getPageNumbers();
    return pageNumbers.length > 0 && pageNumbers[0] > 1;
  }
  
  shouldShowLastPage(): boolean {
    const pageNumbers = this.getPageNumbers();
    return pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1] < this.totalPages;
  }
  
  // NEW: Helper method to check if we should show ellipsis
  shouldShowStartEllipsis(): boolean {
    const pageNumbers = this.getPageNumbers();
    return pageNumbers.length > 0 && pageNumbers[0] > 2;
  }
  
  shouldShowEndEllipsis(): boolean {
    const pageNumbers = this.getPageNumbers();
    return pageNumbers.length > 0 && pageNumbers[pageNumbers.length - 1] < this.totalPages - 1;
  }
  selectStudent(etudiant: Etudiant): void {
    if (this.isAdmin()) {
      this.selectedStudent = this.selectedStudent?.id === etudiant.id ? null : etudiant;
    }
  }

  editEtudiant(etudiant: Etudiant): void {
    this.router.navigate(['/etudiants/edit', etudiant.id]);
  }

  deleteEtudiant(etudiant: Etudiant): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'étudiant ${etudiant.prenom} ${etudiant.nom} ?`)) {
      this.etudiantService.deleteEtudiant(etudiant.id).subscribe({
        next: () => {
          // Reload current page after deletion
          this.loadEtudiants();
        },
        error: (error) => {
          this.errorMessage = 'Erreur lors de la suppression';
          console.error('Error deleting student:', error);
        }
      });
    }
  }

  getAvatarInitials(etudiant: Etudiant): string {
    return (etudiant.prenom.charAt(0) + etudiant.nom.charAt(0)).toUpperCase();
  }

  getAvatarColor(etudiant: Etudiant): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    return colors[etudiant.id % colors.length];
  }

  getMatiereCount(etudiant: Etudiant): string {
    return etudiant.matiere.length > 0 ? `${etudiant.matiere.length} matière(s)` : 'Aucune matière';
  }

  isSelected(etudiant: Etudiant): boolean {
    return this.selectedStudent?.id === etudiant.id;
  }

  toggleMatieres(etudiant: Etudiant, event: Event): void {
    event.stopPropagation();
    if (this.expandedMatieres.has(etudiant.id)) {
      this.expandedMatieres.delete(etudiant.id);
    } else {
      this.expandedMatieres.add(etudiant.id);
    }
  }

  isMatieresExpanded(etudiant: Etudiant): boolean {
    return this.expandedMatieres.has(etudiant.id);
  }

  getDisplayedMatieres(etudiant: Etudiant): string[] {
    if (this.isMatieresExpanded(etudiant)) {
      return etudiant.matiere;
    } else {
      return etudiant.matiere.slice(0, 3);
    }
  }

  getRemainingMatieresCount(etudiant: Etudiant): number {
    return etudiant.matiere.length - 3;
  }

  hasMoreMatieres(etudiant: Etudiant): boolean {
    return etudiant.matiere.length > 3;
  }
}