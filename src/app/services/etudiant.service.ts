//src/app/services/etudiant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Etudiant, EtudiantCreate, PaginatedResponse } from '../interfaces/etudiant';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EtudiantService {
  // private apiUrl = 'http://localhost:3000/etudiants';
  private apiUrl = `${environment.apiBaseUrl}/etudiants`; // EtudiantService


  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Updated to support pagination
  getAllEtudiants(page: number = 1, limit: number = 6, search: string = ''): Observable<PaginatedResponse<Etudiant>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
  
    // Add search parameter if provided
    if (search && search.trim() !== '') {
      params = params.set('search', search.trim());
    }
  
    return this.http.get<PaginatedResponse<Etudiant>>(this.apiUrl, { 
      headers: this.getHeaders(),
      params 
    });
  }

  getEtudiantById(id: number): Observable<Etudiant> {
    return this.http.get<Etudiant>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  // NEW: Check if email already exists
  checkEmailExists(email: string, excludeId?: number): Observable<boolean> {
    let params = new HttpParams().set('email', email);
    if (excludeId !== undefined) {
      params = params.set('excludeId', excludeId.toString());
    }
  
    return this.http
      .get<{ exists: boolean }>(`${this.apiUrl}/check-email`, {
        headers: this.getHeaders(),
        params,
      })
      .pipe(
        map(response => response.exists),
        catchError(() => of(false))
      );
  }
  
  

  createEtudiant(etudiant: EtudiantCreate): Observable<Etudiant> {
    return this.http.post<Etudiant>(this.apiUrl, etudiant, { headers: this.getHeaders() });
  }

  private getHeadersForFormData(): HttpHeaders {
    const token = this.authService.getToken();
    // ⚠️ Don't set Content-Type for FormData - browser sets it with boundary
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }
    
  addEtudiantWithPhoto(formData: FormData): Observable<any> {
    console.log('🌐 Calling POST /add-with-photo');
    return this.http.post<any>(`${this.apiUrl}/add-with-photo`, formData, {
      headers: this.getHeadersForFormData()
    }).pipe(
      tap((resp) => console.log('✅ POST response:', resp)),
      catchError((error) => {
        console.error('❌ POST error:', error);
        return throwError(() => error);
      })
    );
  }
    
  updateEtudiantWithPhoto(id: number, formData: FormData): Observable<any> {
    console.log('🌐 Calling PUT /' + id + '/update-with-photo');
    return this.http.put<any>(`${this.apiUrl}/${id}/update-with-photo`, formData, {
      headers: this.getHeadersForFormData()
    }).pipe(
      tap((resp) => console.log('✅ PUT response:', resp)),
      catchError((error) => {
        console.error('❌ PUT error:', error);
        return throwError(() => error);
      })
    );
  }
  
  updateEtudiant(id: number, etudiant: Partial<Etudiant>): Observable<Etudiant> {
    return this.http.put<Etudiant>(`${this.apiUrl}/${id}`, etudiant, { headers: this.getHeaders() });
  }

  deleteEtudiant(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }
}