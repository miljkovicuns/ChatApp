// services/group-service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chat } from '../models/chat';
import { GroupMemberDto } from '../models/group-member.dto';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/groups';

  createGroup(formData: FormData): Observable<Chat> {
    return this.http.post<Chat>(this.apiUrl, formData);
  }

  updateGroup(chatId: string, formData: FormData): Observable<Chat> {
    return this.http.put<Chat>(`${this.apiUrl}/${chatId}`, formData);
  }

  getMembers(chatId: string): Observable<GroupMemberDto[]> {
    return this.http.get<GroupMemberDto[]>(`${this.apiUrl}/${chatId}/members`);
  }

  addMembers(chatId: string, userIds: string[]): Observable<Chat> {
    return this.http.post<Chat>(`${this.apiUrl}/${chatId}/members`, userIds);
  }

  removeMember(chatId: string, userId: string): Observable<Chat> {
    return this.http.delete<Chat>(`${this.apiUrl}/${chatId}/members/${userId}`);
  }

  updateMemberRole(chatId: string, userId: string, role: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${chatId}/members/${userId}/role`, role);
  }

  generateInvite(chatId: string): Observable<{ link: string }> {
    return this.http.post<{ link: string }>(`${this.apiUrl}/${chatId}/invite`, {});
  }

  joinGroup(token: string): Observable<Chat> {
    const params = new HttpParams().set('token', token);
    return this.http.post<Chat>(`${this.apiUrl}/join`, null, { params });
  }
}
