import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Job, JobRequest, ExternalJob, ExternalJobSearchRequest, ExternalJobFilters } from '../models/job.model';

@Injectable({
  providedIn: 'root'
})
export class JobService {
  private apiUrl = `${environment.apiUrl}/jobs`;
  private externalJobsUrl = `${environment.apiUrl}/external-jobs`;

  constructor(private http: HttpClient) {}

  /**
   * Get all jobs with optional filters
   */
  getJobs(filters?: {
    status?: string;
    job_type?: string;
    search?: string;
    my_jobs?: boolean;
    page?: number;
  }): Observable<{ count: number; results: Job[] }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.status) params = params.set('status', filters.status);
      if (filters.job_type) params = params.set('job_type', filters.job_type);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.my_jobs) params = params.set('my_jobs', 'true');
      if (filters.page) params = params.set('page', filters.page.toString());
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

  // ===== External Jobs Methods =====

  /**
   * Get cached external jobs with filters
   */
  getExternalJobs(filters?: ExternalJobFilters): Observable<{ count: number; results: ExternalJob[] }> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.days) params = params.set('days', filters.days.toString());
      if (filters.location) params = params.set('location', filters.location);
      if (filters.employment_type) params = params.set('employment_type', filters.employment_type);
      if (filters.remote) params = params.set('remote', 'true');
      if (filters.search) params = params.set('search', filters.search);
    }

    return this.http.get<{ count: number; results: ExternalJob[] }>(this.externalJobsUrl + '/', { params });
  }

  /**
   * Search and fetch new external jobs from API
   */
  searchExternalJobs(searchRequest: ExternalJobSearchRequest): Observable<{ count: number; cursor: string; results: ExternalJob[] }> {
    return this.http.post<{ count: number; cursor: string; results: ExternalJob[] }>(
      this.externalJobsUrl + '/',
      searchRequest
    );
  }

  /**
   * Get external job details by job_id
   */
  getExternalJobById(jobId: string, country: string = 'in'): Observable<ExternalJob> {
    let params = new HttpParams().set('country', country);
    return this.http.get<ExternalJob>(`${this.externalJobsUrl}/${jobId}/`, { params });
  }
}
