import {inject, Injectable} from '@angular/core';
import {RegisterRequest} from '../models/register-request';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private http = inject(HttpClient)
  private router = inject(Router)
  private TOKEN_KEY = 'auth_token';
  private USER_KEY = 'user';


  register(user: RegisterRequest, image?: File) {
    const apiUrl = 'http://localhost:8080/api/auth/register'
    const formData = new FormData()

    formData.append(
      'user',
      new Blob(
        [JSON.stringify(user)],
        { type: 'application/json' }
      )
    )

    if(image){
      formData.append('image',image)
    }

    return this.http.post(
      apiUrl,
      formData
    )

  }

  login(username: string, password: string) {
    const formData = new FormData()
    const apiUrl = 'http://localhost:8080/api/auth/login'

    formData.append('username',username)
    formData.append('password',password)

    return this.http.post<any>(
      apiUrl,
      formData
    ).pipe(
      tap(response => {
        if(response.token) {
          this.saveToken(response.token)
        }
        if(response.username) {
          this.saveUser({username: response.username})
        }
      })
    )
  }

  saveToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY,token)
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  saveUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  logout(): void {
    // Clear localStorage
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('chat_settings');

    this.router.navigate(['/login']).then(success => {
      if (!success) {
        window.location.href = '/';
      }
    }).catch(() => {
      window.location.href = '/';
    });
  }
}
