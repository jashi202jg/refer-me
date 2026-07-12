import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { Job, ExternalJob } from '../../models/job.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.css']
})
export class JobListComponent implements OnInit {
  // Internal Jobs State
  jobs: Job[] = [];
  isLoading = true;
  searchTerm = '';
  filterJobType = '';
  filterStatus = '';
  showMyJobs = false;

  // Pagination State
  currentPage = 1;
  pageSize = 10;
  totalJobs = 0;
  totalPages = 0;

  // External Jobs State
  externalJobs: ExternalJob[] = [];
  isLoadingExternal = false;
  isFetchingFromAPI = false;
  activeTab: 'internal' | 'external' = 'internal';

  externalFilters = {
    days: 30,
    location: '',
    employment_type: '',
    remote: false,
    search: ''
  };

  searchConfig = {
    query: '',
    location: '',
    country: 'in'
  };

  constructor(
    private jobService: JobService,
    public authService: AuthService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['my_jobs'] === 'true' || params['my_jobs'] === true) {
        this.showMyJobs = true;
        this.searchTerm = '';
        this.currentPage = 1;
        this.loadJobs(true);
      } else if (params['external'] === 'true' && params['company']) {
        this.showMyJobs = false;
        this.searchTerm = params['company'];
        this.currentPage = 1;
        this.loadJobs(true);
      } else {
        this.currentPage = 1;
        this.loadJobs(true);
      }
    });
  }

  loadJobs(showLoadingIndicator: boolean = true) {
    if (showLoadingIndicator) {
      this.isLoading = true;
    }
    
    const filters: any = {
      page: this.currentPage
    };
    if (this.searchTerm) filters.search = this.searchTerm;
    if (this.filterJobType) filters.job_type = this.filterJobType;
    if (this.filterStatus) filters.status = this.filterStatus;
    if (this.showMyJobs && this.authService.isReferrer) filters.my_jobs = true;

    this.jobService.getJobs(filters).subscribe({
      next: (response) => {
        this.jobs = response.results;
        this.totalJobs = response.count;
        this.totalPages = Math.ceil(this.totalJobs / this.pageSize);
        this.isLoading = false;
        if (this.authService.isCandidate) {
          this.notificationService.checkNewJobs(this.jobs);
        }
      },
      error: (error) => {
        console.error('Error loading jobs:', error);
        this.isLoading = false;
      }
    });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadJobs();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadJobs();
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadJobs();
    }
  }

  loadExternalJobs() {
    this.isLoadingExternal = true;
    this.jobService.getExternalJobs(this.externalFilters).subscribe({
      next: (response) => {
        this.externalJobs = response.results;
        this.isLoadingExternal = false;
      },
      error: (error) => {
        console.error('Error loading cached external jobs:', error);
        this.isLoadingExternal = false;
      }
    });
  }

  fetchExternalJobsForCompany(companyName: string) {
    this.isFetchingFromAPI = true;
    this.isLoadingExternal = true;

    const searchRequest = {
      query: `${companyName} jobs`,
      num_pages: 1,
      country: this.searchConfig.country,
      location: this.externalFilters.location || undefined,
      date_posted: this.getDatePostedValue(),
      work_from_home: this.externalFilters.remote,
      employment_types: this.externalFilters.employment_type || undefined
    };

    this.jobService.searchExternalJobs(searchRequest).subscribe({
      next: (response) => {
        console.log(`Fetched ${response.count} jobs from external API for ${companyName}`);
        this.isFetchingFromAPI = false;
        this.loadExternalJobs();
      },
      error: (error) => {
        console.error('Error fetching external jobs from API:', error);
        alert('Failed to fetch jobs from external API. Please check your API key configuration.');
        this.isFetchingFromAPI = false;
        this.loadExternalJobs(); // fall back to loading whatever is cached
      }
    });
  }

  fetchFromExternalAPI() {
    if (this.externalFilters.search) {
      this.fetchExternalJobsForCompany(this.externalFilters.search);
    } else {
      this.fetchExternalJobsForCompany('software developer');
    }
  }

  getDatePostedValue(): 'all' | 'today' | '3days' | 'week' | 'month' {
    const daysMap: { [key: number]: 'today' | '3days' | 'week' | 'month' } = {
      1: 'today',
      3: '3days',
      7: 'week',
      30: 'month'
    };
    return daysMap[this.externalFilters.days] || 'month';
  }

  onSearch() {
    this.currentPage = 1;
    if (this.activeTab === 'internal') {
      this.loadJobs();
    } else {
      this.loadExternalJobs();
    }
  }

  onFilterChange() {
    this.currentPage = 1;
    if (this.activeTab === 'internal') {
      this.loadJobs();
    } else {
      this.loadExternalJobs();
    }
  }

  applyExternalFilters() {
    this.loadExternalJobs();
  }

  clearExternalFilters() {
    this.externalFilters = {
      days: 30,
      location: '',
      employment_type: '',
      remote: false,
      search: ''
    };
    this.loadExternalJobs();
  }

  clearFilters() {
    this.searchTerm = '';
    this.filterJobType = '';
    this.filterStatus = '';
    this.showMyJobs = false;
    this.currentPage = 1;
    this.loadJobs();
  }

  switchTab(tab: 'internal' | 'external') {
    this.activeTab = tab;
    // Clear query params when user manually toggles tabs to avoid sticky state
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: ''
    });
    if (tab === 'internal') {
      this.loadJobs();
    } else {
      this.loadExternalJobs();
    }
  }

  getStatusClass(status: string): string {
    return status === 'open' ? 'status-open' : 'status-closed';
  }

  getRelativeTime(dateString: string): string {
    if (!dateString) return '';
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
