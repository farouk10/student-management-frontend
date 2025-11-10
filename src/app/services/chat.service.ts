// src/app/services/chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatMessage, PaginatedChatMessages, ChatUser } from '../interfaces/chat';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment'; // <-- added

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  // use environment.apiBaseUrl so it matches backend host
  private apiUrl = `${environment.apiBaseUrl}/api/chat`;

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

  getMessages(page: number = 1, limit: number = 50): Observable<PaginatedChatMessages> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PaginatedChatMessages>(`${this.apiUrl}/messages`, {
      headers: this.getHeaders(),
      params
    });
  }

  sendMessage(message: string): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/messages`, { message }, {
      headers: this.getHeaders()
    });
  }

  getOnlineUsers(): Observable<ChatUser[]> {
    return this.http.get<ChatUser[]>(`${this.apiUrl}/online-users`, {
      headers: this.getHeaders()
    });
  }
}
