import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
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
  isLoading = true;

  constructor(
    private applicationService: ApplicationService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.isLoading = true;
    this.applicationService.getApplications().subscribe({
      next: (response) => {
        this.applications = response.results;
        this.isLoading = false;
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
        alert('Error updating status: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  deleteApplication(applicationId: number) {
    if (confirm('Are you sure you want to withdraw this application?')) {
      this.applicationService.deleteApplication(applicationId).subscribe({
        next: () => {
          this.loadApplications();
        },
        error: (error) => {
          alert('Error deleting application: ' + (error.error?.message || 'Unknown error'));
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
