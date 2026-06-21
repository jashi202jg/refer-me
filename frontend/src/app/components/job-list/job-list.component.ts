import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { Job } from '../../models/job.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css']
})
export class JobListComponent implements OnInit {
  jobs: Job[] = [];
  isLoading = true;
  searchTerm = '';
  filterJobType = '';
  filterStatus = '';
  showMyJobs = false;

  constructor(
    private jobService: JobService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.isLoading = true;
    
    const filters: any = {};
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.filterJobType) filters.job_type = this.filterJobType;
    if (this.filterStatus) filters.status = this.filterStatus;
    if (this.showMyJobs && this.authService.isReferrer) filters.my_jobs = true;

    this.jobService.getJobs(filters).subscribe({
      next: (response) => {
        this.jobs = response.results;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch() {
    this.loadJobs();
  }

  onFilterChange() {
    this.loadJobs();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterJobType = '';
    this.filterStatus = '';
    this.showMyJobs = false;
    this.loadJobs();
  }

  getStatusClass(status: string): string {
    return status === 'open' ? 'status-open' : 'status-closed';
  }
}
