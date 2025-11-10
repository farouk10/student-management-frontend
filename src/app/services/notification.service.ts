import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppNotification, NotificationStorage } from '../interfaces/notification';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private storageKey = 'app_notifications';
  private notificationsSubject = new BehaviorSubject<AppNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    this.loadNotifications();
    // Clean up expired notifications every minute
    setInterval(() => this.cleanupExpiredNotifications(), 60000);
  }

  private loadNotifications(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data: NotificationStorage = JSON.parse(stored);
        const validNotifications = data.notifications.filter(notification => 
          Date.now() < notification.expiresAt
        );
        
        if (validNotifications.length !== data.notifications.length) {
          this.saveNotifications(validNotifications);
        }
        
        this.notificationsSubject.next(validNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
      this.notificationsSubject.next([]);
    }
  }

  private saveNotifications(notifications: AppNotification[]): void {
    const storageData: NotificationStorage = {
      notifications,
      lastCleanup: Date.now()
    };
    localStorage.setItem(this.storageKey, JSON.stringify(storageData));
    this.notificationsSubject.next(notifications);
  }

  private cleanupExpiredNotifications(): void {
    const currentNotifications = this.notificationsSubject.value;
    const validNotifications = currentNotifications.filter(notification => 
      Date.now() < notification.expiresAt
    );
    
    if (validNotifications.length !== currentNotifications.length) {
      this.saveNotifications(validNotifications);
    }
  }

  addNotification(notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'expiresAt'>): void {
    const newNotification: AppNotification = {
      ...notificationData,
      id: this.generateId(),
      timestamp: Date.now(),
      expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour from now
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 20);
    
    this.saveNotifications(updatedNotifications);
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = currentNotifications.filter(notification => notification.id !== id);
    this.saveNotifications(updatedNotifications);
  }

  clearAllNotifications(): void {
    this.saveNotifications([]);
  }

  getNotificationCount(): number {
    return this.notificationsSubject.value.length;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours} h`;
    if (diffDays < 7) return `Il y a ${diffDays} j`;
    return `Il y a ${Math.floor(diffDays / 7)} sem`;
  }
}