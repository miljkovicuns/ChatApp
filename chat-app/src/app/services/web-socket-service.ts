import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client | null = null;
  private connectedSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<any>(null);
  private unreadSubject = new BehaviorSubject<any>(null);
  private typingSubject = new BehaviorSubject<any>(null);

  private currentChatId: string | null = null;

  constructor() {}

  connect(): void {
    try {
      // ✅ Use SockJS (handles CORS better)
      console.log('🔄 Attempting to connect to WebSocket...');

      const socket = new SockJS('http://localhost:8080/ws');

      this.stompClient = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        debug: (str) => console.log('🔍 STOMP debug:', str)
      });

      this.stompClient.onConnect = () => {
        this.connectedSubject.next(true);
        console.log('STOMP connected successfully');

        // Subscribe to user notifications
        this.stompClient?.subscribe('/user/queue/notifications', (message) => {
          console.log('Notification received:', message.body);
        });
      };

      this.stompClient.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        this.connectedSubject.next(false);
      };

      this.stompClient.onDisconnect = () => {
        this.connectedSubject.next(false);
        console.log('STOMP disconnected');
      };

      this.stompClient.activate();

    } catch (error) {
      console.error('Connection error:', error);
    }
  }

  // ✅ Fix: Proper message handling
  private handleMessage(message: any): void {
    // Check if it's an unread update
    if (message.unreadCount !== undefined && message.chatId) {
      this.unreadSubject.next(message);
      return;
    }

    // Check if it's a typing indicator
    if (message.typing !== undefined && message.chatId) {
      this.typingSubject.next(message);
      return;
    }

    // Default: treat as chat message
    if (message.chatId) {
      this.messageSubject.next(message);
    }
  }

  // ✅ Add subscription to specific chat
  subscribeToChat(chatId: string): void {
    if (!this.stompClient?.connected) {
      console.warn('Not connected, cannot subscribe to chat');
      return;
    }

    this.currentChatId = chatId;
    console.log(`📡 Subscribing to chat: ${chatId}`);

    // Subscribe to chat messages
    this.stompClient.subscribe(`/topic/chat/${chatId}`, (message) => {
      try {
        const msg = JSON.parse(message.body);
        console.log('📨 Chat message received:', msg);
        this.messageSubject.next(msg);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Subscribe to unread updates
    this.stompClient.subscribe(`/topic/chat/${chatId}/unread`, (message) => {
      try {
        const update = JSON.parse(message.body);
        console.log('📊 Unread update received:', update);
        this.unreadSubject.next(update);
      } catch (error) {
        console.error('Error parsing unread update:', error);
      }
    });
  }

  unsubscribeFromChat(): void {
    this.currentChatId = null;
  }

  // ✅ Fix: Proper message sending format
  sendMessage(chatId: string, content: string, senderId: string): void {
    if (!this.stompClient?.connected) {
      console.warn('⚠️ STOMP is not connected');
      return;
    }

    const message = {
      chatId: chatId,
      content: content,
      senderId: senderId
    };

    console.log('📤 Sending message:', message);

    this.stompClient.publish({
      destination: '/app/chat.sendMessage',
      body: JSON.stringify(message)
    });
  }

  // ✅ Fix: Mark as read with correct format
  markAsRead(chatId: string): void {
    if (!this.stompClient?.connected) {
      console.warn('⚠️ STOMP is not connected');
      return;
    }

    const request = { chatId: chatId };

    console.log('📤 Marking as read:', request);

    this.stompClient.publish({
      destination: '/app/chat.markRead',
      body: JSON.stringify(request)
    });
  }

  sendTyping(chatId: string, isTyping: boolean): void {
    if (!this.stompClient?.connected) return;

    this.stompClient.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify({
        chatId: chatId,
        typing: isTyping
      })
    });
  }

  // Observables
  onMessage(): Observable<any> {
    return this.messageSubject.asObservable();
  }

  onUnreadUpdate(): Observable<any> {
    return this.unreadSubject.asObservable();
  }

  onTyping(): Observable<any> {
    return this.typingSubject.asObservable();
  }

  isConnected(): Observable<boolean> {
    return this.connectedSubject.asObservable();
  }

  getConnected(): boolean {
    return this.connectedSubject.value;
  }

  disconnect(): void {
    if (this.stompClient) {
      this.stompClient.deactivate();
      this.connectedSubject.next(false);
    }
  }
}
