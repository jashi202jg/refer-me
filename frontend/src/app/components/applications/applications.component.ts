import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
import { NotificationService } from '../../services/notification.service';
import { Application } from '../../models/job.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.css']
})
export class ApplicationsComponent implements OnInit {
  applications: Application[] = [];
  selectedApplication: Application | null = null;
  isLoading = true;

  constructor(
    private applicationService: ApplicationService,
    public authService: AuthService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadApplications(true);
    this.route.queryParams.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.selectApplicationById(+id);
      } else {
        this.selectedApplication = null;
      }
    });
  }

  loadApplications(showLoadingIndicator: boolean = true) {
    if (showLoadingIndicator) {
      this.isLoading = true;
    }
    this.applicationService.getApplications().subscribe({
      next: (response) => {
        this.applications = response.results;
        this.isLoading = false;
        
        const id = this.route.snapshot.queryParams['id'];
        if (id) {
          this.selectApplicationById(+id);
        }
        
        if (this.authService.isReferrer) {
          this.notificationService.checkNewApplications(this.applications);
        }
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.isLoading = false;
      }
    });
  }

  updateStatus(applicationId: number, status: string) {
    this.applicationService.updateApplicationStatus(applicationId, status).subscribe({
      next: () => {
        this.loadApplications();
        if (this.selectedApplication && this.selectedApplication.id === applicationId) {
          this.selectedApplication.status = status as any;
        }
      },
      error: (error) => {
        this.modalService.alert('Error', 'Error updating status: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  async deleteApplication(applicationId: number) {
    const confirmed = await this.modalService.danger(
      'Withdraw Application',
      'Are you sure you want to withdraw this job application?',
      'Withdraw'
    );
    if (confirmed) {
      this.applicationService.deleteApplication(applicationId).subscribe({
        next: () => {
          if (this.selectedApplication && this.selectedApplication.id === applicationId) {
            this.clearSelection();
          }
          this.loadApplications();
        },
        error: (error) => {
          this.modalService.alert('Error', 'Error withdrawing application: ' + (error.error?.message || 'Unknown error'));
        }
      });
    }
  }

  selectApplicationById(id: number) {
    if (this.applications.length > 0) {
      const found = this.applications.find(app => app.id === id);
      this.selectedApplication = found || null;
    }
  }

  viewDetails(application: Application) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: application.id },
      queryParamsHandling: 'merge'
    });
  }

  clearSelection() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge'
    });
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'reviewing': 'status-reviewing',
      'shortlisted': 'status-shortlisted',
      'referred': 'status-referred',
      'rejected': 'status-rejected'
    };
    return statusClasses[status] || '';
  }
}
