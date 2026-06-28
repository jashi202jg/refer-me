import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription, timer } from 'rxjs';
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
export class ApplicationsComponent implements OnInit, OnDestroy {
  applications: Application[] = [];
  isLoading = true;
  private pollSubscription: Subscription | null = null;

  constructor(
    private applicationService: ApplicationService,
    public authService: AuthService,
    private modalService: ModalService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadApplications(true);
    // Poll every 10 seconds for new submissions/status updates
    this.pollSubscription = timer(10000, 10000).subscribe(() => {
      this.loadApplications(false);
    });
  }

  ngOnDestroy() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }

  loadApplications(showLoadingIndicator: boolean = true) {
    if (showLoadingIndicator) {
      this.isLoading = true;
    }
    this.applicationService.getApplications().subscribe({
      next: (response) => {
        this.applications = response.results;
        this.isLoading = false;
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
          this.loadApplications();
        },
        error: (error) => {
          this.modalService.alert('Error', 'Error withdrawing application: ' + (error.error?.message || 'Unknown error'));
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
      'rejected': 'status-rejected'
    };
    return statusClasses[status] || '';
  }
}
