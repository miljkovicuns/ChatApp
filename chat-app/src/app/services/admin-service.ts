import {inject, Service} from '@angular/core';
import {RegistrationRequest} from '../models/registration-request';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Service()
export class AdminService {

  private http = inject(HttpClient)
  private apiUrl = "http://localhost:8080/api/admin"

  getAllRequests(): Observable<RegistrationRequest[]> {
    return this.http.get<RegistrationRequest[]>(`${this.apiUrl}/register/request`)
  }


  approveRequest(id: string): Observable<RegistrationRequest> {
    return this.http.post<RegistrationRequest>(`${this.apiUrl}/register/request/accept`,id)
  }

  rejectRequest(id: string) {
    return this.http.post<RegistrationRequest>(`${this.apiUrl}/register/request/reject`,id)
  }
}
