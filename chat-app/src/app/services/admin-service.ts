import {inject, Service} from '@angular/core';
import {RegistrationRequest} from '../models/registration-request';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

@Service()
export class AdminService {

  private http = inject(HttpClient)
  private apiUrl = "http://localhost:8080/api/admin"

  getAllRequests(): Observable<RegistrationRequest[]> {
    return this.http.get<RegistrationRequest[]>(`${this.apiUrl}/register/request`)
  }


  approveRequest(id: string): Observable<RegistrationRequest> {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<RegistrationRequest>(`${this.apiUrl}/register/request/accept`, JSON.stringify(id), {headers})
  }

  rejectRequest(id: string) {
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.post<RegistrationRequest>(`${this.apiUrl}/register/request/reject`, JSON.stringify(id), {headers})
  }
}
