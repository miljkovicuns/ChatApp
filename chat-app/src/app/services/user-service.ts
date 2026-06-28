import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {User} from '../models/user';
import {HttpParams} from '@angular/common/http';
import {UserFilterParams} from '../models/user-filter-params';
import {UpdateProfileRequest} from '../models/update-profile-request';
import {Dashboard} from '../pages/dashboard/dashboard';

@Service()
export class UserService {

  private http = inject(HttpClient)
  private apiUrl = 'http://localhost:8080/api/users'

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.apiUrl}`
    )
  }

  getFilteredUsers(params: UserFilterParams): Observable<User[]> {
    let httpParams = new HttpParams()

    if (params.searchQuery) {
      httpParams = httpParams.set('searchQuery', params.searchQuery)
    }

    if (params.lastSeen && params.lastSeen !== 'all') {
      httpParams = httpParams.set('lastSeen', params.lastSeen)
    }

    if (params.hasImage && params.hasImage !== 'all') {
      httpParams = httpParams.set('hasImage', params.hasImage)
    }

    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy)
    }

    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder)
    }

    return this.http.get<User[]>(`${this.apiUrl}/filter`, { params: httpParams })
  }

  updateLastSeen(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/heartbeat`, {})
  }


  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
  }

  updateProfile(updateData: UpdateProfileRequest, image?: File): Observable<Map<string,any>> {
    let formData = new FormData()

    formData.append('request',new Blob(
      [JSON.stringify(updateData)],
      {type: 'application/json'}
    ))

    if(image){
      formData.append('image',image)
    }

    return this.http.patch<Map<string,any>>(`${this.apiUrl}/me`, formData)
  }
}
