import {inject, Inject, Injectable} from '@angular/core';
import {async, BehaviorSubject, Observable} from 'rxjs';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {Auth} from './auth';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private stompClient: Client = new Client({
    // webSocketFactory: () => socket,
    brokerURL: "ws://localhost:8080/api/ws",
    beforeConnect: async () => {this.stompClient.connectHeaders={Authorization : "Bearer " + localStorage.getItem("auth_token")}},
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    // debug: (str) => console.log('🔍 STOMP debug:', str)
  })
  private connectedSubject = new BehaviorSubject<boolean>(false)
  private messageSubject = new BehaviorSubject<any>(null)
  private unreadSubject = new BehaviorSubject<any>(null)
  private typingSubject = new BehaviorSubject<any>(null)
  private deliverySubject = new BehaviorSubject<any>(null);
  private readReceiptSubject = new BehaviorSubject<null>(null);
  private reactionSubject = new BehaviorSubject<any>(null);

  private authService = inject(Auth)

  private currentChatId: string | null = null;

  constructor() {}

  connect(): void {
    try {

      // const socket = new SockJS('ws://localhost:8080/ws');

      this.stompClient.onConnect = () => {
        this.connectedSubject.next(true);

        // Subscribe to user notifications
        this.stompClient?.subscribe('/user/queue/notifications', (message) => {
        })

        this.stompClient?.subscribe("/user/queue/delivery", message => {
          try {
            const delivery = JSON.parse(message.body);
            this.deliverySubject.next(delivery);
          } catch (error) {
            console.error('Error parsing delivery update:', error);
          }
        })
      };

      this.stompClient.onStompError = (frame) => {
        console.error('STOMP error:', frame);
        this.connectedSubject.next(false);
      };

      this.stompClient.onDisconnect = () => {
        this.connectedSubject.next(false);
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

    // Subscribe to chat messages
    this.stompClient.subscribe(`/topic/chat/${chatId}`, (message) => {
      try {
        const msg = JSON.parse(message.body);
        this.messageSubject.next(msg);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    // Subscribe to unread updates
    this.stompClient.subscribe(`/topic/chat/${chatId}/unread`, (message) => {
      try {
        const update = JSON.parse(message.body);
        this.unreadSubject.next(update);
      } catch (error) {
        console.error('Error parsing unread update:', error);
      }
    });

    this.stompClient.subscribe(`/topic/chat/${chatId}/read`, message => {
      try {
        const receipt = JSON.parse(message.body);
        this.readReceiptSubject.next(receipt);
      } catch (error) {
        console.error('Error parsing read receipt:', error);
      }
    })

    this.stompClient.subscribe(`/topic/chat/${chatId}/typing`, message => {
      try {
        const typing = JSON.parse(message.body);
        this.typingSubject.next(typing);
      } catch (error) {
        console.error('Error parsing typing indicator:', error);
      }
    });

    this.stompClient.subscribe(`/topic/chat/${chatId}/reactions`, message => {
      try {
        const update = JSON.parse(message.body);
        this.reactionSubject.next(update);
      } catch (error) {
        console.error('Error parsing reaction update:', error);
      }
    });
  }

  unsubscribeFromChat(): void {
    this.currentChatId = null;
  }

  // ✅ Fix: Proper message sending format
  sendMessage(chatId: string, content: string, senderId: string, replyToId?: string, forwardedFromId?: string): void {
    if (!this.stompClient?.connected) {
      console.warn('⚠️ STOMP is not connected');
      return;
    }

    const payload: any = {
      chatId: chatId,
      content: content,
      senderId: senderId
    };

    if (replyToId) payload.replyToId = replyToId;
    if (forwardedFromId) payload.forwardedFromId = forwardedFromId;
    this.stompClient.publish({ destination: '/app/chat.sendMessage', body: JSON.stringify(payload) });
  }

  // ✅ Fix: Mark as read with correct format
  markAsRead(chatId: string): void {
    if (!this.stompClient?.connected) {
      console.warn('⚠️ STOMP is not connected');
      return;
    }

    const request = { chatId: chatId };


    this.stompClient.publish({
      destination: '/app/chat.markRead',
      body: JSON.stringify(request)
    });
  }

  markAsDelivered(messageId: string, userId: string): void {
    if (!this.stompClient?.connected) {
      console.warn('⚠️ STOMP is not connected');
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.markDelivered',
      body: JSON.stringify({
        messageId: messageId,
        userId: userId,
        senderId: this.authService.getUser()?.id
      })
    });
  }

  onDeliveryUpdate(): Observable<any> {
    return this.deliverySubject.asObservable();
  }

  onReadReceipt(): Observable<any> {
    return this.readReceiptSubject.asObservable();
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

  sendReaction(messageId: string, chatId: string, reactionType: string): void {
    if (!this.stompClient?.connected) {
      console.warn('⚠️ STOMP is not connected');
      return;
    }

    this.stompClient.publish({
      destination: '/app/chat.addReaction',
      body: JSON.stringify({
        messageId: messageId,
        chatId: chatId,
        reactionType: reactionType
      })
    });
  }

  onReactionUpdate(): Observable<any> {
    return this.reactionSubject.asObservable();
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
