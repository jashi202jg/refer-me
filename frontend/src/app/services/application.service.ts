import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Application, ApplicationRequest } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private apiUrl = `${environment.apiUrl}/applications`;

  constructor(private http: HttpClient) {}

  /**
   * Get all applications (filtered by user type)
   */
  getApplications(filters?: {
    job_id?: number;
    status?: string;
  }): Observable<{ count: number; results: Application[] }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.job_id) params = params.set('job_id', filters.job_id.toString());
      if (filters.status) params = params.set('status', filters.status);
    }

    return this.http.get<{ count: number; results: Application[] }>(this.apiUrl + '/', { params });
  }

  /**
   * Get application by ID
   */
  getApplicationById(id: number): Observable<Application> {
    return this.http.get<Application>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Create application (candidate only)
   */
  createApplication(applicationData: ApplicationRequest): Observable<Application> {
    return this.http.post<Application>(this.apiUrl + '/', applicationData);
  }

  /**
   * Update application status (referrer only)
   */
  updateApplicationStatus(id: number, status: string, notes?: string): Observable<Application> {
    return this.http.patch<Application>(`${this.apiUrl}/${id}/`, { status, notes });
  }

  /**
   * Delete application (candidate only)
   */
  deleteApplication(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
