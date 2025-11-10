// src/app/services/socket.service.ts
import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Observable, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);

  constructor(private ngZone: NgZone, private authService: AuthService) {
    // Auto-connect/disconnect based on authentication state
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // if there's a logged-in user and socket is not connected, connect
        if (!this.socket || !this.socket.connected) {
          console.log('🔄 Auth present — connecting socket...');
          this.connect();
        }
      } else {
        // no user -> ensure socket disconnected
        if (this.socket) {
          console.log('🔌 No auth — disconnecting socket...');
          this.disconnect();
        }
      }
    });
  }

  /**
   * Connect the socket (idempotent).
   * Handshake includes JWT token from AuthService (if available).
   */
  connect(): void {
    if (this.socket && this.socket.connected) {
      console.log('🔌 Socket already connected');
      return;
    }

    const token = this.authService.getToken() || '';
    console.log('🔄 Attempting Socket.IO connection to:', environment.apiBaseUrl);
    console.log('🔑 Token available:', !!token);

    // Use polling as primary transport since WebSocket is having issues
    this.socket = io(environment.apiBaseUrl, {
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      auth: {
        token: token ? `Bearer ${token}` : ''
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true
    });

    this.socket.on('connect', () => {
      this.ngZone.run(() => {
        this.connected$.next(true);
      });
      console.log('✅ Socket connected successfully! ID:', this.socket?.id);
      console.log('📡 Transport:', this.socket?.io?.engine?.transport?.name);
    });

    this.socket.on('disconnect', (reason: any) => {
      this.ngZone.run(() => {
        this.connected$.next(false);
      });
      console.log('❌ Socket disconnected. Reason:', reason);
    });

    this.socket.on('connect_error', (err: any) => {
      console.error('❌ Socket connection failed:', err.message);
      console.error('❌ Connection error details:', err);
    });

    this.socket.on('error', (err: any) => {
      console.error('❌ Socket error:', err);
    });
  }

  disconnect(): void {
    if (!this.socket) return;
    try {
      this.socket.disconnect();
    } catch (e) {
      console.warn('Error during socket disconnect', e);
    }
    this.socket = null;
    this.connected$.next(false);
  }

  isConnected$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Listen to a named event from server as an Observable.
   * Automatically ensures Angular zone and unsubscribes when subscription ends.
   */
  on<T>(eventName: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      if (!this.socket) {
        this.connect();
      }

      const handler = (payload: T) => {
        this.ngZone.run(() => subscriber.next(payload));
      };

      this.socket!.on(eventName, handler);

      return () => {
        try {
          this.socket!.off(eventName, handler);
        } catch (err) {
          // ignore
        }
      };
    });
  }

  /**
   * Emit an event to the server.
   */
  emit(eventName: string, data?: any): void {
    if (!this.socket) this.connect();
    try {
      this.socket!.emit(eventName, data);
    } catch (err) {
      console.warn('Socket emit failed', err);
    }
  }
}
