// src/app/components/user-list/user-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../../interfaces/user';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-user-list',
  standalone: false,
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit, OnDestroy {
  users: User[] = [];
  filteredUsers: User[] = [];
  isLoading = false;
  isSearching = false;
  errorMessage = '';

  // Search handling
  searchTerm = '';
  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  // Delete confirmation
  showDeleteModal = false;
  userToDelete: User | null = null;
  isDeleting = false;

  currentUser: User | null = null;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadUsers();

    // subscribe to current user so we can disable deleting self
    this.currentUser = this.authService.getCurrentUser();

    // debounced search
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(term => {
        this.isSearching = false;
        this.applyFilter(term);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users || [];
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
        this.toastService.show({ message: 'Failed to load users', type: 'error', duration: 4000 });
      }
    });
  }

  // Called on input (two-way bound), pushes into subject
  searchUsers(): void {
    this.isSearching = true;
    this.search$.next(this.searchTerm.trim());
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter('');
  }

  private applyFilter(term: string): void {
    if (!term) {
      this.filteredUsers = [...this.users];
      return;
    }
    const t = term.toLowerCase();
    this.filteredUsers = this.users.filter(u =>
      (u.prenom || '').toLowerCase().includes(t) ||
      (u.nom || '').toLowerCase().includes(t) ||
      (u.email || '').toLowerCase().includes(t)
    );
  }

  // Highlight matched term in UI (returns SafeHtml)
  highlight(text: string | undefined, fieldTerm?: string): SafeHtml {
    if (!text || !this.searchTerm) return this.sanitizer.bypassSecurityTrustHtml(text || '');
    const term = this.searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex
    const re = new RegExp(`(${term})`, 'ig');
    const html = (text || '').replace(re, '<strong>$1</strong>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  // Navigation for edit
  editUser(user: User): void {
    this.router.navigate(['/admin/users/edit', user._id]);
  }

  // Show delete modal
  confirmDelete(user: User): void {
    if (this.isSelf(user)) {
      this.toastService.show({ message: 'You cannot delete your own account', type: 'warning', duration: 4000 });
      return;
    }
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  // Execute delete
  async deleteUserConfirmed(): Promise<void> {
    if (!this.userToDelete) return;
    this.isDeleting = true;
    const id = this.userToDelete._id;
    this.userService.deleteUser(id).subscribe({
      next: () => {
        // Optimistically remove
        this.users = this.users.filter(u => u._id !== id);
        this.filteredUsers = this.filteredUsers.filter(u => u._id !== id);
        this.toastService.show({ message: 'User deleted', type: 'success', duration: 3000 });
        this.isDeleting = false;
        this.showDeleteModal = false;
        this.userToDelete = null;
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.toastService.show({ message: err?.error?.message || 'Delete failed', type: 'error', duration: 5000 });
        this.isDeleting = false;
      }
    });
  }

  cancelDelete(): void {
    this.userToDelete = null;
    this.showDeleteModal = false;
  }

  // Role badge classes
  getRoleBadgeClass(role?: string): string {
    switch (role) {
      case 'admin':
        return 'badge bg-danger';
      case 'moderator':
        return 'badge bg-info text-dark';
      default:
        return 'badge bg-secondary';
    }
  }

  // Status helper (example)
  getStatusInfo(user: User): { text: string; class: string } {
    // Placeholder logic: you can extend with real status fields
    return { text: 'Active', class: 'badge bg-success' };
  }

  // Helpers for avatar initials/color
  getAvatarInitials(user: User): string {
    const p = user.prenom || '';
    const n = user.nom || '';
    return ((p.charAt(0) || '') + (n.charAt(0) || '')).toUpperCase();
  }

  getAvatarColor(user: User): string {
    const baseColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const char = (user._id?.charCodeAt(0) || 0);
    return baseColors[char % baseColors.length];
  }

  isSelf(user: User): boolean {
    return this.currentUser?._id === user._id;
  }

}
