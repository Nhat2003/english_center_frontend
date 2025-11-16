import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import * as SockJS from 'sockjs-client';
import { Client, Message, StompSubscription } from '@stomp/stompjs';

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
  otherUserName?: string;        // From backend
  otherUserFullName?: string;    // For compatibility
  otherUserAvatar?: string;
  lastMessage?: ChatMessage | string;  // Can be string from backend
  lastAt?: string;               // Backend field
  unreadCount: number;
}

export interface ChatContact {
  id: number;
  fullName: string;
  avatar?: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private baseUrl = 'http://localhost:8080';
  private stompClient: Client | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);
  private subscriptions: Map<string, StompSubscription> = new Map();

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

  // REST API: Get contacts list (users who can chat)
  getContacts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/chat/contacts`);
  }

  // WebSocket: Connect with STOMP over SockJS
  connect(): void {
    if (this.stompClient && this.stompClient.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    const token = this.getToken();
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    try {
      // Initialize STOMP client with SockJS
      this.stompClient = new Client({
        webSocketFactory: () => {
          // Use SockJS with token as query parameter
          return new SockJS(`${this.baseUrl}/ws/chat?token=${token}`) as any;
        },

        // Connection headers (token in header as backup)
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },

        // Debug output
        debug: (str) => {
          console.log('[STOMP Debug]:', str);
        },

        // Reconnect settings
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,

        // Connection callback
        onConnect: (frame) => {
          console.log('✅ STOMP Connected:', frame);
          this.connected$.next(true);

          // Subscribe to personal queue
          const userId = this.getCurrentUserId();
          if (userId && userId > 0) {
            const personalSub = this.stompClient?.subscribe(
              `/user/queue/messages`,
              (message: Message) => {
                this.handleIncomingMessage(message);
              }
            );

            if (personalSub) {
              this.subscriptions.set('personal-queue', personalSub);
            }

            console.log(`📩 Subscribed to /user/queue/messages`);
          }
        },

        // Disconnect callback
        onStompError: (frame) => {
          console.error('❌ STOMP Error:', frame.headers['message']);
          console.error('Additional details:', frame.body);
          this.connected$.next(false);
        },

        // WebSocket error
        onWebSocketError: (event) => {
          console.warn('⚠️ WebSocket error (chat may not work):', event);
        },

        // WebSocket close
        onWebSocketClose: (event) => {
          console.log('🔌 WebSocket closed');
          this.connected$.next(false);
        }
      });

      // Activate the client
      this.stompClient.activate();
      console.log('🔄 Activating STOMP client...');

    } catch (error) {
      console.warn('Failed to initialize WebSocket (chat will be unavailable):', error);
      this.connected$.next(false);
    }
  }

  // Handle incoming STOMP message
  private handleIncomingMessage(message: Message): void {
    try {
      const chatMessage: ChatMessage = JSON.parse(message.body);
      console.log('📬 Received message:', chatMessage);

      // Emit to personal messages stream
      this.personalMessages$.next(chatMessage);

      // Also emit to conversation-specific stream
      this.conversationMessages$.next(chatMessage);
    } catch (e) {
      console.error('Failed to parse incoming message:', e);
    }
  }

  // WebSocket: Disconnect
  disconnect(): void {
    try {
      if (this.stompClient && this.stompClient.connected) {
        // Unsubscribe all
        this.subscriptions.forEach((sub) => {
          sub.unsubscribe();
        });
        this.subscriptions.clear();

        // Deactivate client
        this.stompClient.deactivate();
        this.stompClient = null;
        this.connected$.next(false);
        console.log('✅ WebSocket disconnected');
      }
    } catch (error) {
      console.warn('Error during WebSocket disconnect:', error);
      this.stompClient = null;
      this.connected$.next(false);
    }
  }

  // Subscribe to specific conversation for realtime updates
  subscribeToConversation(conversationId: string, callback: (msg: ChatMessage) => void): void {
    if (!this.stompClient || !this.stompClient.connected) {
      console.warn('Cannot subscribe to conversation - not connected');
      return;
    }

    // Subscribe to conversation topic
    const subscription = this.stompClient.subscribe(
      `/topic/conversation.${conversationId}`,
      (message: Message) => {
        try {
          const chatMessage: ChatMessage = JSON.parse(message.body);
          callback(chatMessage);
        } catch (e) {
          console.error('Failed to parse conversation message:', e);
        }
      }
    );

    this.subscriptions.set(`conversation-${conversationId}`, subscription);
    console.log('📩 Subscribed to conversation:', conversationId);
  }

  // Unsubscribe from conversation
  unsubscribeFromConversation(conversationId: string): void {
    const key = `conversation-${conversationId}`;
    const subscription = this.subscriptions.get(key);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(key);
      console.log('🚫 Unsubscribed from conversation:', conversationId);
    }
  }

  // Send message via WebSocket STOMP
  sendMessage(receiverId: number, content: string): void {
    const payload: ChatMessage = {
      receiverId,
      content
    };

    if (this.stompClient && this.stompClient.connected) {
      // Send via WebSocket STOMP to /app/chat.sendMessage
      // Backend will save to DB and broadcast to both users
      this.stompClient.publish({
        destination: '/app/chat.sendMessage',
        body: JSON.stringify(payload)
      });
      console.log('📤 Message sent via WebSocket STOMP to /app/chat.sendMessage');
    } else {
      // Fallback to REST API POST /chat/send if WebSocket not connected
      console.warn('⚠️ WebSocket not connected, using HTTP fallback');
      this.http.post(`${this.baseUrl}/chat/send`, payload).subscribe({
        next: (response) => {
          console.log('📤 Message sent via REST API POST /chat/send:', response);
        },
        error: (err) => console.error('❌ Send message error:', err)
      });
    }
  }

  // Check if connected
  isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }
}
