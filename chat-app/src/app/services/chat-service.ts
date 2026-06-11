import {inject, Injectable, Service} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Chat} from '../models/chat';
import {CreateGroupChatRequest} from '../models/create-group-chat-request';
import {Message} from '../models/message';
import {SendMessageRequest} from '../models/send-message-request';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = `http://localhost:8080/api/chats`;

  getUserChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(`${this.apiUrl}/my-chats`)
  }

  getChatById(chatId: string): Observable<Chat> {
    return this.http.get<Chat>(`${this.apiUrl}/${chatId}`)
  }

  createDirectChat(participantIds: string[]): Observable<Chat> {
    return this.http.post<Chat>(`${this.apiUrl}/direct`,{ participantIds })
  }

  createGroupChat(request: CreateGroupChatRequest): Observable<Chat> {
    return this.http.post<Chat>(`${this.apiUrl}/group`, { request })
  }

  updateGroupChat(chatId: string, name: string, description: string): Observable<Chat> {
    return this.http.put<Chat>(`${this.apiUrl}/${chatId}`, { name, description });
  }

  addParticipants(chatId: string, userIds: string[]): Observable<Chat> {
    return this.http.post<Chat>(`${this.apiUrl}/${chatId}/participants`, { userIds });
  }

  removeParticipant(chatId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${chatId}/participants/${userId}`);
  }

  leaveGroupChat(chatId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${chatId}/leave`, {});
  }

  getMessages(chatId: string, page: number = 0, size: number = 50): Observable<Message[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<Message[]>(`${this.apiUrl}/${chatId}/messages`, { params });
  }

  sendMessage(request: SendMessageRequest): Observable<Message> {
    return this.http.post<Message>(`${this.apiUrl}/messages`, request);
  }

  markMessagesAsRead(chatId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${chatId}/mark-read`, {});
  }

  getUnreadCount(chatId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/${chatId}/unread-count`);
  }

  deleteMessage(messageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/messages/${messageId}`);
  }

  searchChats(query: string): Observable<Chat[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Chat[]>(`${this.apiUrl}/search`, { params });
  }
}
