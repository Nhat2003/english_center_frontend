import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import * as SockJS from 'sockjs-client';

export interface ChatMessage {
  id?: number;
  senderId?: number;
  receiverId: number;
  content: string;
  sentAt?: string;
  isRead?: boolean;
  conversationId?: string;
  isOwn?: boolean; // UI helper field
}

export interface Conversation {
  conversationId: string;
  otherUserId: number;
  otherUserFullName: string;
  otherUserAvatar?: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

// Simple STOMP Frame interface
interface StompFrame {
  command: string;
  headers: { [key: string]: string };
  body: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8080';
  private websocket: WebSocket | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private subscriptions: Map<string, (msg: ChatMessage) => void> = new Map();

  // Subjects để emit messages
  public personalMessages$ = new BehaviorSubject<ChatMessage | null>(null);
  public conversationMessages$ = new BehaviorSubject<ChatMessage | null>(null);

  constructor(private http: HttpClient) {}

  // Get JWT token from localStorage
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get current user ID from localStorage or decode JWT
  getCurrentUserId(): number {
    try {
      const userStr = localStorage.getItem('user'); // Changed to 'user' for consistency
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id || 0;
      }
    } catch (error) {
      console.error('Error getting current user ID:', error);
    }
    return 0;
  }

  // Generate conversation ID
  getConversationId(userId1: number, userId2: number): string {
    const min = Math.min(userId1, userId2);
    const max = Math.max(userId1, userId2);
    return `user-${min}_user-${max}`;
  }

  // REST API: Get chat history
  getChatHistory(otherUserId: number, page: number = 0, size: number = 100): Observable<ChatMessage[]> {
    const params = new HttpParams()
      .set('with', otherUserId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<ChatMessage[]>(`${this.baseUrl}/chat/history`, { params });
  }

  // REST API: Mark message as read
  markAsRead(messageId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/chat/mark-read/${messageId}`, {});
  }

  // REST API: Get conversations list
  getConversations(page: number = 0, size: number = 50): Observable<Conversation[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<Conversation[]>(`${this.baseUrl}/chat/conversations`, { params });
  }

  // WebSocket: Connect with STOMP over SockJS
  connect(): void {
    if (this.websocket) {
      return; // Already connected
    }

    try {
      const socket = new SockJS(`${this.baseUrl}/ws`);
      this.websocket = socket as any;

      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.connected$.next(true);

        // Send CONNECT frame
        this.sendStompFrame('CONNECT', {
          'accept-version': '1.1,1.0',
          'heart-beat': '10000,10000'
        });
      };

      this.websocket.onmessage = (event) => {
        try {
          const frame = this.parseStompFrame(event.data);

          if (frame.command === 'CONNECTED') {
            console.log('STOMP connected');
            // Subscribe to personal messages
            const userId = this.getCurrentUserId();
            if (userId && userId > 0) {
              this.sendStompFrame('SUBSCRIBE', {
                'id': 'sub-0',
                'destination': `/user/${userId}/queue/messages`
              });
            }
          } else if (frame.command === 'MESSAGE') {
            // Handle incoming message
            try {
              const message: ChatMessage = JSON.parse(frame.body);
              this.personalMessages$.next(message);

              // Also notify conversation-specific subscribers
              if (message.conversationId && this.subscriptions.has(message.conversationId)) {
                const callback = this.subscriptions.get(message.conversationId);
                if (callback) callback(message);
              }
            } catch (e) {
              console.error('Failed to parse message:', e);
            }
          }
        } catch (e) {
          console.error('Failed to process WebSocket message:', e);
        }
      };

      this.websocket.onerror = (error) => {
        console.warn('WebSocket error (chat may not work):', error);
        this.connected$.next(false);
        // Don't throw error - allow app to continue
      };

      this.websocket.onclose = () => {
        console.log('WebSocket closed');
        this.connected$.next(false);
        this.websocket = null;
      };
    } catch (error) {
      console.warn('Failed to connect WebSocket (chat will be unavailable):', error);
      this.websocket = null;
      this.connected$.next(false);
      // Don't throw error - allow app to continue without chat
    }
  }

  // WebSocket: Disconnect
  disconnect(): void {
    try {
      if (this.websocket) {
        this.sendStompFrame('DISCONNECT', {});
        this.websocket.close();
        this.websocket = null;
        this.connected$.next(false);
        console.log('WebSocket disconnected');
      }
    } catch (error) {
      console.warn('Error during WebSocket disconnect:', error);
      this.websocket = null;
      this.connected$.next(false);
    }
  }

  // Subscribe to specific conversation for realtime updates
  subscribeToConversation(conversationId: string, callback: (msg: ChatMessage) => void): void {
    this.subscriptions.set(conversationId, callback);
    console.log('Subscribed to conversation:', conversationId);
  }

  // Unsubscribe from conversation
  unsubscribeFromConversation(conversationId: string): void {
    this.subscriptions.delete(conversationId);
    console.log('Unsubscribed from conversation:', conversationId);
  }

  // Send message via WebSocket STOMP
  sendMessage(receiverId: number, content: string): void {
    const payload: ChatMessage = {
      receiverId,
      content
    };

    if (this.websocket && this.connected$.value) {
      // Send via WebSocket STOMP
      this.sendStompFrame('SEND', {
        'destination': '/app/chat.send'
      }, JSON.stringify(payload));
    } else {
      // Fallback to HTTP if WebSocket not connected
      console.warn('WebSocket not connected, using HTTP fallback');
      this.http.post(`${this.baseUrl}/chat/send`, payload).subscribe({
        next: (response) => {
          console.log('Message sent via HTTP:', response);
        },
        error: (err) => console.error('Send message error:', err)
      });
    }
  }

  // Helper: Send STOMP frame
  private sendStompFrame(command: string, headers: { [key: string]: string }, body: string = ''): void {
    if (!this.websocket) return;

    let frame = command + '\n';
    for (const key in headers) {
      frame += `${key}:${headers[key]}\n`;
    }
    frame += '\n' + body + '\0';

    this.websocket.send(frame);
  }

  // Helper: Parse STOMP frame
  private parseStompFrame(data: string): StompFrame {
    const lines = data.split('\n');
    const command = lines[0];
    const headers: { [key: string]: string } = {};
    let bodyStartIndex = 1;

    for (let i = 1; i < lines.length; i++) {
      if (lines[i] === '') {
        bodyStartIndex = i + 1;
        break;
      }
      const colonIndex = lines[i].indexOf(':');
      if (colonIndex > 0) {
        const key = lines[i].substring(0, colonIndex);
        const value = lines[i].substring(colonIndex + 1);
        headers[key] = value;
      }
    }

    const body = lines.slice(bodyStartIndex).join('\n').replace(/\0$/, '');

    return { command, headers, body };
  }

  // Check if connected (polling active)
  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }
}
