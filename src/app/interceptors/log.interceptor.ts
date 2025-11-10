// src/app/interceptors/log.interceptor.ts
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable()
export class LogInterceptor implements HttpInterceptor {
    private apiUrl = `${environment.apiBaseUrl}/logs`;
    private clientIp: string | null = null; // cache IP
  
    constructor(
      private authService: AuthService,
      private http: HttpClient
    ) {
      this.fetchClientIp(); // get IP once on load
    }
  
    // 🧠 Fetch client public IP once
    private fetchClientIp(): void {
      this.http.get<{ ip: string }>('https://api.ipify.org?format=json').subscribe({
        next: (res) => {
          this.clientIp = res.ip;
          console.log('🌍 Client IP detected:', this.clientIp);
        },
        error: (err) => console.warn('⚠️ Could not fetch IP:', err.message)
      });
    }
  
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
      return next.handle(request).pipe(
        tap({
          next: (event) => {
            if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
              const method = request.method.toUpperCase();
    
              let actionType: string | null = null;
              if (method === 'POST') actionType = 'CREATE';
              else if (method === 'PUT' || method === 'PATCH') actionType = 'UPDATE';
              else if (method === 'DELETE') actionType = 'DELETE';
    
              // Skip logging for certain URLs
              if (
                !actionType ||
                request.url.includes('/api/users/login') ||
                request.url.includes('/api/users/register') ||
                request.url.includes('/logs')
              ) {
                return;
              }
    
              const user = this.authService.getCurrentUser();
              if (!user) return;
    
              let entityId: string | null = null;
              let entityName: string | null = null;
  
              // ✅ Handle different response structures
              let entityData = event.body;
              
              // If response has a nested 'student' property (only for CREATE with photo)
              if (entityData?.student && method === 'POST') {
                entityData = entityData.student;
              }
              // For UPDATE, the response is now consistent (direct object)
    
              if (method === 'POST' && entityData) {
                entityId = entityData._id;
                entityName = `${entityData.nom || ''} ${entityData.prenom || ''}`.trim();
                console.log("✅✅ POST - entityId: ", entityId, "entityName:", entityName);
                  
              } else if (method === 'DELETE' && entityData) {
                // ✅ Capture name BEFORE the student is deleted
                entityId = entityData._id;
                entityName = `${entityData.nom || ''} ${entityData.prenom || ''}`.trim();
                console.log("✅✅ DELETE - entityId: ", entityId, "entityName:", entityName);
  
              } else if (method === 'PUT' || method === 'PATCH') {
                // For update actions
                entityId = entityData._id;
                entityName = entityData?.nom ? `${entityData.nom} ${entityData.prenom || ''}`.trim() : null;
                console.log("✅✅ UPDATE - entityId: ", entityId, "entityName:", entityName);
  
              } else {
                entityId = entityData?._id;
                console.log("✅✅ OTHER - entityId: ", entityId);
              }
                  
              // 🪵 Log after action succeeds
              setTimeout(() => {
                console.log('🧩 Logging payload:', {
                  userId: user._id,
                  actionType,
                  etudiant_id: entityId,
                  etudiant_name: entityName,
                  ip: this.clientIp
                });
                    
                this.http.post(this.apiUrl, {
                  userId: user._id,
                  actionType,
                  etudiant_id: entityId,
                  etudiant_name: entityName,
                  ip: this.clientIp
                }).subscribe({
                  next: () => console.log(`🪵 Logged ${actionType} (${entityName || entityId}) by ${user.email}`),
                  error: (err) => console.error('❌ Failed to log action:', err)
                });
              }, 0);
            }
          }
        })
      );
    }
      
    // Extract numeric ID (like /etudiants/23)
    private extractEntityIdFromUrl(url: string): string | null {
      const match = url.match(/\/(\d+)(?:[\/?]|$)/);
      return match ? match[1] : null;
    }
  }