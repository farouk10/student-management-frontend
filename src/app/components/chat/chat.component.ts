// src/app/components/chat/chat.component.ts
import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { SocketService } from '../../services/socket.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, ChatUser } from '../../interfaces/chat';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: false,
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatMessages') private chatMessagesContainer!: ElementRef;

  messages: ChatMessage[] = [];
  onlineUsers: ChatUser[] = [];
  newMessage = '';
  isLoading = false;
  currentUser!: ChatUser | null;

  private destroy$ = new Subject<void>();

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUser = user
      ? {
          userId: user._id,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
          email: user.email,
        }
      : null;

    // ensure socket connection is established (SocketService will use token automatically)
    this.socketService.connect();

    // load messages and initial online users
    this.loadMessages();
    this.seedOnlineUsers();
    this.loadOnlineUsers();

    // setup socket listeners (new messages, online users updates, etc.)
    this.setupSocketListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  private loadOnlineUsers(): void {
    this.chatService.getOnlineUsers().subscribe({
      next: (users) => this.onlineUsers = users,
      error: (err) => console.error('Error fetching online users:', err)
    });
  }
  

  private loadMessages(): void {
    this.isLoading = true;
    this.chatService.getMessages().subscribe({
      next: (response) => {
        this.messages = response.messages;
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.isLoading = false;
      }
    });
  }

  private seedOnlineUsers(): void {
    // get initial online users via HTTP (useful while socket connects)
    this.chatService.getOnlineUsers().subscribe({
      next: (list) => {
        this.onlineUsers = list || [];
      },
      error: (err) => {
        // ignore - will be updated via socket event if available
        console.warn('Could not fetch online users via HTTP:', err);
      }
    });
  }

  private setupSocketListeners(): void {
    // Listen for new messages
    this.socketService.on<ChatMessage>('newChatMessage')
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: ChatMessage) => {
        this.messages.push(message);
        this.scrollToBottom();
      });

    // Listen for online users updates
    this.socketService.on<ChatUser[]>('onlineUsers')
      .pipe(takeUntil(this.destroy$))
      .subscribe((list: ChatUser[]) => {
        this.onlineUsers = list || [];
      });

    // ✅ Listen for online users updates
    this.socketService.on<ChatUser[]>('onlineUsers')
    .pipe(takeUntil(this.destroy$))
    .subscribe((users: ChatUser[]) => {
      this.onlineUsers = users;
      console.log('👥 Updated online users:', users);
    });

  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    this.chatService.sendMessage(this.newMessage).subscribe({
      next: (message) => {
        this.newMessage = '';
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.chatMessagesContainer) {
        this.chatMessagesContainer.nativeElement.scrollTop =
          this.chatMessagesContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUserDisplayName(user: ChatUser): string {
    return `${user.prenom} ${user.nom}`;
  }

  isCurrentUser(message: ChatMessage): boolean {
    return message.user.userId === this.currentUser?.userId;
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  getAvatarColor(user: ChatUser): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    // Create a simple hash from user ID
    const userId = user.userId || user.email || '';
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }
}
