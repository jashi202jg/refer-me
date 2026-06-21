import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { JobService } from '../../services/job.service';
import { ApplicationService } from '../../services/application.service';
import { Job, Application } from '../../models/job.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  recentJobs: Job[] = [];
  applications: Application[] = [];
  myJobs: Job[] = [];
  isLoading = true;

  constructor(
    public authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService
  ) {}

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;

    if (this.authService.isCandidate) {
      // Load recent jobs for candidates
      this.jobService.getJobs({ status: 'open' }).subscribe({
        next: (response) => {
          this.recentJobs = response.results.slice(0, 5);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading jobs:', error);
          this.isLoading = false;
        }
      });

      // Load candidate's applications
      this.applicationService.getApplications().subscribe({
        next: (response) => {
          this.applications = response.results.slice(0, 5);
        },
        error: (error) => {
          console.error('Error loading applications:', error);
        }
      });
    } else if (this.authService.isReferrer) {
      // Load referrer's posted jobs
      this.jobService.getJobs({ my_jobs: true }).subscribe({
        next: (response) => {
          this.myJobs = response.results.slice(0, 5);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading jobs:', error);
          this.isLoading = false;
        }
      });

      // Load applications to referrer's jobs
      this.applicationService.getApplications().subscribe({
        next: (response) => {
          this.applications = response.results.slice(0, 5);
        },
        error: (error) => {
          console.error('Error loading applications:', error);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'reviewing': 'status-reviewing',
      'shortlisted': 'status-shortlisted',
      'referred': 'status-referred',
      'rejected': 'status-rejected',
      'open': 'status-open',
      'closed': 'status-closed'
    };
    return statusClasses[status] || '';
  }
}
