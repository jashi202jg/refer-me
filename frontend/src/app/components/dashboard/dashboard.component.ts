import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { JobService } from '../../services/job.service';
import { ApplicationService } from '../../services/application.service';
import { NotificationService } from '../../services/notification.service';
import { Job, Application, ExternalJob } from '../../models/job.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  recentJobs: Job[] = [];
  externalJobs: ExternalJob[] = [];
  applications: Application[] = [];
  myJobs: Job[] = [];
  isLoading = true;
  isLoadingExternal = false;
  isFetchingFromAPI = false;
  activeTab: 'internal' | 'external' = 'internal';

  // Filters for external jobs
  filters = {
    days: 7,
    location: '',
    employment_type: '',
    remote: false,
    search: ''
  };

  // Search configuration for API fetch
  searchConfig = {
    query: 'software developer jobs',
    location: '',
    country: 'in'  // Set to 'in' for India, 'us' for USA
  };

  constructor(
    public authService: AuthService,
    private jobService: JobService,
    private applicationService: ApplicationService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDashboardData(true);
  }

  loadDashboardData(showLoadingIndicator: boolean = true) {
    if (showLoadingIndicator) {
      this.isLoading = true;
    }

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

  loadExternalJobs() {
    this.isLoadingExternal = true;
    this.jobService.getExternalJobs(this.filters).subscribe({
      next: (response) => {
        this.externalJobs = response.results;
        this.isLoadingExternal = false;
        
        // If no cached jobs found, suggest fetching from API
        if (this.externalJobs.length === 0 && !this.hasAppliedFilters()) {
          console.log('No cached external jobs found. Click "Fetch Latest Jobs" to load from API.');
        }
      },
      error: (error) => {
        console.error('Error loading external jobs:', error);
        this.isLoadingExternal = false;
      }
    });
  }

  fetchFromExternalAPI() {
    this.isFetchingFromAPI = true;
    
    // Build query based on filters
    let query = this.searchConfig.query;
    if (this.filters.search) {
      query = this.filters.search;
    } else if (this.filters.location) {
      query = `developer jobs in ${this.filters.location}`;
    }

    const searchRequest = {
      query: query,
      num_pages: 1,
      country: this.searchConfig.country,
      location: this.searchConfig.location || this.filters.location,
      date_posted: this.getDatePostedValue(),
      work_from_home: this.filters.remote,
      employment_types: this.filters.employment_type || undefined
    };

    this.jobService.searchExternalJobs(searchRequest).subscribe({
      next: (response) => {
        console.log(`Fetched ${response.count} jobs from external API`);
        this.isFetchingFromAPI = false;
        // Reload cached jobs to show newly fetched data
        this.loadExternalJobs();
      },
      error: (error) => {
        console.error('Error fetching from external API:', error);
        alert('Failed to fetch jobs from external API. Please check your API key configuration.');
        this.isFetchingFromAPI = false;
      }
    });
  }

  getDatePostedValue(): 'all' | 'today' | '3days' | 'week' | 'month' {
    const daysMap: { [key: number]: 'today' | '3days' | 'week' | 'month' } = {
      1: 'today',
      3: '3days',
      7: 'week',
      30: 'month'
    };
    return daysMap[this.filters.days] || 'week';
  }

  hasAppliedFilters(): boolean {
    return this.filters.location !== '' ||
           this.filters.employment_type !== '' ||
           this.filters.remote === true ||
           this.filters.search !== '';
  }

  applyFilters() {
    this.loadExternalJobs();
  }

  clearFilters() {
    this.filters = {
      days: 7,
      location: '',
      employment_type: '',
      remote: false,
      search: ''
    };
    this.loadExternalJobs();
  }

  switchTab(tab: 'internal' | 'external') {
    this.activeTab = tab;
  }

  viewCompanyExternalJobs() {
    const company = this.authService.currentUserValue?.company;
    if (company) {
      this.router.navigate(['/jobs'], { queryParams: { external: 'true', company: company } });
    }
  }

  viewExternalJobDetails(jobId: string) {
    // Open external job details in a modal or navigate to details page
    // For now, we'll just log it - you can implement a modal later
    console.log('View details for job:', jobId);
    // TODO: Implement modal or details page for external jobs
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

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  }
}
