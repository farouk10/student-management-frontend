// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { EtudiantService } from '../../services/etudiant.service';
import { AuthService } from '../../services/auth.service';
import { Etudiant, PaginatedResponse } from '../../interfaces/etudiant';
import { ToastService } from '../../services/toast.service';
import { SocketService } from '../../services/socket.service';
import { NotificationService } from '../../services/notification.service';
import { AppNotification, DeletePayload, EtudiantWithAction } from '../../interfaces/notification';
import { Subject, filter, takeUntil } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  etudiants: Etudiant[] = [];
  selectedStudent: Etudiant | null = null;
  isLoading = true;
  errorMessage = '';

  // Dashboard statistics
  totalStudents = 0;
  totalMatieres = 0;
  recentStudentsCount = 0;

  // Pagination for dashboard student list
  currentPage = 1;
  itemsPerPage = 6;
  totalPages = 1;
  hasNext = false;
  hasPrev = false;

  // Modal state
  showStudentModal = false;
  showAllNotifications = false;

  // Notifications
  notifications: AppNotification[] = [];

  private destroy$ = new Subject<void>();

  isSocketConnected = false;


  constructor(
    private etudiantService: EtudiantService,
    private authService: AuthService,
    private toastService: ToastService,
    private socketService: SocketService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadNotifications();
    this.setupSocketConnection();
    this.setupRouteListener();

    this.debugSocketEvents();

  }

  private setupRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      if (event.url === '/dashboard') {
        console.log('🔄 Returning to dashboard, ensuring socket connection...');
        this.socketService.connect();
      }
    });
  }
  

  private setupSocketConnection(): void {

    this.socketService.isConnected$().subscribe(connected => {
      this.isSocketConnected = connected;
      console.log('📡 Socket connection status:', connected);
    });
  
    this.socketService.connect();
  
    this.socketService.on<EtudiantWithAction>('etudiantCreated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        console.log('📨✅ RECEIVED etudiantCreated event:', payload);
        console.log('👤✅ User in create event:', payload.performedBy);
        this.handleEtudiantCreated(payload);
      });
  
    this.socketService.on<EtudiantWithAction>('etudiantUpdated')
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        console.log('📨✅ RECEIVED etudiantUpdated event:', payload);
        console.log('👤✅ User in update event:', payload.performedBy);
        this.handleEtudiantUpdated(payload);
      });
  
    this.socketService.on<DeletePayload>('etudiantDeleted')
      .pipe(takeUntil(this.destroy$))
      .subscribe(payload => {
        console.log('📨✅ RECEIVED etudiantDeleted event:', payload);
        console.log('👤✅ User in delete event:', payload.performedBy);
        this.handleEtudiantDeleted(payload);
      });
  
    this.socketService.on('error')
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        console.error('❌ Socket error:', error);
      });
  }
  

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadNotifications(): void {
    this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
  }

  private handleEtudiantCreated(etudiant: EtudiantWithAction): void {
    console.log('🔔 Student created event received:', etudiant);
  
    // Update UI - remove performedBy before adding to list
    const { performedBy, ...etudiantWithoutUser } = etudiant;
    
    this.etudiants.unshift(etudiantWithoutUser);
    if (this.etudiants.length > this.itemsPerPage) {
      this.etudiants.pop();
    }
    this.totalStudents++;
    this.calculateStatistics();
    this.toastService.show({ 
      message: `Étudiant ajouté: ${etudiant.prenom} ${etudiant.nom}`, 
      type: 'success', 
      duration: 4000 
    });
  
    // Add notification - USE performedBy FROM BACKEND, not local user
    if (etudiant.performedBy) {
      console.log('📝 CREATE: Creating notification with backend user:', etudiant.performedBy);
      this.notificationService.addNotification({
        type: 'etudiant_created',
        message: `Étudiant ${etudiant.prenom} ${etudiant.nom} a été créé`,
        performedBy: etudiant.performedBy, // ✅ Use backend data
        target: {
          nom: etudiant.nom,
          prenom: etudiant.prenom,
        }
      });
    } else {
      console.warn('❌ No performedBy data in create event');
      // Fallback to local user if backend data is missing
      this.notificationService.addNotification({
        type: 'etudiant_created',
        message: `Étudiant ${etudiant.prenom} ${etudiant.nom} a été créé`,
        performedBy: {
          nom: this.authService.getCurrentUser()?.nom || 'Admin',
          prenom: this.authService.getCurrentUser()?.prenom || 'System',
          role: this.authService.getCurrentUser()?.role || 'admin',
        },
        target: {
          nom: etudiant.nom,
          prenom: etudiant.prenom,
        }
      });
    }
  }
  
  private handleEtudiantDeleted(payload: DeletePayload): void {
    console.log('🔔 Student deleted event received:', payload);
  
    // Update UI
    const deletedStudent = this.etudiants.find(e => e.id === payload.id);
    this.etudiants = this.etudiants.filter(e => e.id !== payload.id);
    this.totalStudents = Math.max(0, this.totalStudents - 1);
    this.calculateStatistics();
    
    if (deletedStudent) {
      this.toastService.show({ 
        message: `Étudiant supprimé: ${deletedStudent.prenom} ${deletedStudent.nom}`, 
        type: 'warning', 
        duration: 3000 
      });
  
      // Add notification - USE performedBy FROM BACKEND, not local user
      console.log('📝 DELETE: Creating notification with backend user:', payload.performedBy);
      this.notificationService.addNotification({
        type: 'etudiant_deleted',
        message: `Étudiant ${payload.prenom} ${payload.nom} a été supprimé`,
        performedBy: payload.performedBy, // ✅ Use backend data
        target: {
          nom: payload.nom,
          prenom: payload.prenom,
        }
      });
    }
  
    // If the currently-open modal was for this student, close it
    if (this.selectedStudent && this.selectedStudent.id === payload.id) {
      this.closeStudentModal();
    }
  }
    
  private handleEtudiantUpdated(etudiant: EtudiantWithAction): void {
    console.log('🔔 Student updated event received:', etudiant);
  
    // Update UI - remove performedBy before updating list
    const { performedBy, ...etudiantWithoutUser } = etudiant;
    
    const idx = this.etudiants.findIndex(e => e.id === etudiant.id);
    if (idx !== -1) {
      this.etudiants[idx] = etudiantWithoutUser;
    }
    this.calculateStatistics();
    this.toastService.show({ 
      message: `Étudiant modifié: ${etudiant.prenom} ${etudiant.nom}`, 
      type: 'info', 
      duration: 3000 
    });
  
    // Add notification - USE performedBy FROM BACKEND, not local user
    if (etudiant.performedBy) {
      console.log('📝 Creating notification with backend user:', etudiant.performedBy);
      this.notificationService.addNotification({
        type: 'etudiant_updated',
        message: `Étudiant ${etudiant.prenom} ${etudiant.nom} a été modifié`,
        performedBy: etudiant.performedBy, // ✅ Use backend data
        target: {
          nom: etudiant.nom,
          prenom: etudiant.prenom,
        }
      });
    } else {
      console.warn('❌ No performedBy data in update event');
      // Fallback to local user if backend data is missing
      this.notificationService.addNotification({
        type: 'etudiant_updated',
        message: `Étudiant ${etudiant.prenom} ${etudiant.nom} a été modifié`,
        performedBy: {
          nom: this.authService.getCurrentUser()?.nom || 'Admin',
          prenom: this.authService.getCurrentUser()?.prenom || 'System',
          role: this.authService.getCurrentUser()?.role || 'admin',
        },
        target: {
          nom: etudiant.nom,
          prenom: etudiant.prenom,
        }
      });
    }
  }
  



  // Notification methods
  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  clearAllNotifications(): void {
    this.notificationService.clearAllNotifications();
  }

  getNotificationIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'etudiant_created': 'bi-person-plus text-success',
      'etudiant_updated': 'bi-pencil text-warning',
      'etudiant_deleted': 'bi-person-dash text-danger'
    };
    return icons[type] || 'bi-bell text-primary';
  }

  getNotificationTime(timestamp: number): string {
    return this.notificationService.formatTimeAgo(timestamp);
  }

  // ... rest of your existing methods (isAdmin, loadDashboardData, calculateStatistics, etc.)
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  loadDashboardData(): void {
    this.isLoading = true;

    const currentPageBeforeRefresh = this.currentPage;

    this.etudiantService.getAllEtudiants(currentPageBeforeRefresh, this.itemsPerPage).subscribe({
      next: (response: PaginatedResponse<Etudiant>) => {
        this.etudiants = response.etudiants;
        this.totalStudents = response.pagination.totalItems;
        this.currentPage = response.pagination.currentPage;
        this.totalPages = response.pagination.totalPages;
        this.hasNext = response.pagination.hasNext;
        this.hasPrev = response.pagination.hasPrev;

        this.calculateStatistics();
        this.isLoading = false;

        this.toastService.show({
          message: 'Dashboard refreshed successfully',
          type: 'success',
          duration: 2000
        });
      },
      error: (error) => {
        this.errorMessage = 'Error while refreshing';
        this.isLoading = false;

        this.toastService.show({
          message: 'Error while refreshing dashboard',
          type: 'error',
          duration: 3000
        });

        console.error('Error refreshing dashboard:', error);
      }
    });
  }

  calculateStatistics(): void {
    const allMatieres = this.etudiants.flatMap(e => e.matiere || []);
    this.totalMatieres = new Set(allMatieres).size;
    this.recentStudentsCount = this.etudiants.length;
  }

  viewStudentDetails(etudiant: Etudiant): void {
    this.selectedStudent = etudiant;
    this.showStudentModal = true;
  }

  closeStudentModal(): void {
    this.showStudentModal = false;
    this.selectedStudent = null;
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadDashboardData();
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

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Avatar and color methods (same as etudiant-list)
  getAvatarInitials(etudiant: Etudiant): string {
    return ((etudiant.prenom?.charAt(0) || '') + (etudiant.nom?.charAt(0) || '')).toUpperCase();
  }

  getAvatarColor(etudiant: Etudiant): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    // fallback if id missing
    const idx = typeof etudiant.id === 'number' ? etudiant.id : (etudiant.id ? parseInt(String(etudiant.id).slice(-1), 10) : 0);
    return colors[idx % colors.length];
  }

  getMatiereCount(etudiant: Etudiant): string {
    return (etudiant.matiere && etudiant.matiere.length > 0) ? `${etudiant.matiere.length} matière(s)` : 'Aucune matière';
  }

  
  private debugSocketEvents(): void {
    this.socketService.on<any>('etudiantCreated').subscribe(payload => {
      console.log('🔍 DEBUG etudiantCreated payload:', payload);
    });
    
    this.socketService.on<any>('etudiantUpdated').subscribe(payload => {
      console.log('🔍 DEBUG etudiantUpdated payload:', payload);
    });
    
    this.socketService.on<any>('etudiantDeleted').subscribe(payload => {
      console.log('🔍 DEBUG etudiantDeleted payload:', payload);
    });
  }
  
}
