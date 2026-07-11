import {inject, Service} from '@angular/core';
import {RegistrationRequest} from '../models/registration-request';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {User} from '../models/user';
import {AnalyticsSummaryDto} from '../models/analytics-summary.dto';
import {AnalyticsTimeSeriesDto} from '../models/analytics-time-series-dto';

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

  updateUserRole(userId: string, newRole: string): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${userId}/role`, { role: newRole });
  }

  toggleUserActive(userId: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${userId}/toggle-active`, {});
  }

  // admin-service.ts
  getAnalytics(startDate: string, endDate: string): Observable<AnalyticsSummaryDto> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<AnalyticsSummaryDto>(`${this.apiUrl}/analytics`, { params });
  }

  getTimeSeriesAnalytics(startDate: string, endDate: string, groupBy: string): Observable<AnalyticsTimeSeriesDto[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate)
      .set('groupBy', groupBy);
    return this.http.get<AnalyticsTimeSeriesDto[]>(`${this.apiUrl}/analytics/time-series`, { params });
  }
}
