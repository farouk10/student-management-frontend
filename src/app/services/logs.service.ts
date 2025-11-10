import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment'; // <-- added

export interface Log {
  _id: string;
  createdAt: string;
  userId: { email: string; nom?: string; prenom?: string };
  actionType: string;
  entityId?: { nom: string; prenom: string };
  ipAddress?: string;
  entityFallback?: string; // ✅ Add this line
  entityName?: { nom: string; prenom: string };

}

@Injectable({
  providedIn: 'root',
})
export class LogsService {
  
  private apiUrl = `${environment.apiBaseUrl}/logs`;


  constructor(private http: HttpClient) {}

  getLogsByActionType(actionType: string): Observable<Log[]> {
    const url = `${this.apiUrl}/type/${actionType}`;
    console.log('🌐 Calling URL:', url);
    return this.http.get<Log[]>(url);
  }
  
  getAllLogs(): Observable<Log[]> {
    console.log('🌐 Calling URL:', this.apiUrl);
    return this.http.get<Log[]>(this.apiUrl);
  }
  
  deleteLog(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  deleteAllLogs(): Observable<any> {
    return this.http.delete(this.apiUrl);
  }

  getLogsByUserId(userId: string): Observable<Log[]> {
    return this.http.post<Log[]>(`${this.apiUrl}/user`, { userId });
  }
}
