import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Job, JobRequest } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/jobs`;

  constructor(private http: HttpClient) {}

  /**
   * Get all jobs with optional filters
   */
  getJobs(filters?: {
    status?: string;
    job_type?: string;
    search?: string;
    my_jobs?: boolean;
  }): Observable<{ count: number; results: Job[] }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.job_type) params = params.set('job_type', filters.job_type);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.my_jobs) params = params.set('my_jobs', 'true');
    }

    return this.http.get<{ count: number; results: Job[] }>(this.apiUrl + '/', { params });
  }

  /**
   * Get job by ID
   */
  getJobById(id: number): Observable<Job> {
    return this.http.get<Job>(`${this.apiUrl}/${id}/`);
  }

  /**
   * Create new job (referrer only)
   */
  createJob(jobData: JobRequest): Observable<Job> {
    return this.http.post<Job>(this.apiUrl + '/', jobData);
  }

  /**
   * Update job (owner only)
   */
  updateJob(id: number, jobData: Partial<JobRequest>): Observable<Job> {
    return this.http.patch<Job>(`${this.apiUrl}/${id}/`, jobData);
  }

  /**
   * Delete job (owner only)
   */
  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/`);
  }
}
