import {inject, Service} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../models/user';

@Service()
export class UserService {

  private http = inject(HttpClient)
  private apiUrl = 'http://localhost:8080/api/users'

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.apiUrl}`
    )
  }


  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`)
  }
}
