import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { JobService } from '../../services/job.service';
import { ApplicationService } from '../../services/application.service';
import { AuthService } from '../../services/auth.service';
import { Job } from '../../models/job.model';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.css']
})
export class JobDetailComponent implements OnInit {
  job: Job | null = null;
  isLoading = true;
  showApplicationForm = false;
  applicationForm: FormGroup;
  applicationSubmitting = false;
  applicationSuccess = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService,
    private applicationService: ApplicationService,
    public authService: AuthService,
    private fb: FormBuilder
  ) {
    this.applicationForm = this.fb.group({
      cover_letter: ['', Validators.required],
      resume_url: ['', [Validators.required, Validators.pattern('https?://.+')]]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadJob(id);
  }

  loadJob(id: number) {
    this.jobService.getJobById(id).subscribe({
      next: (job) => {
        this.job = job;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading job:', error);
        this.isLoading = false;
      }
    });
  }

  toggleApplicationForm() {
    this.showApplicationForm = !this.showApplicationForm;
  }

  submitApplication() {
    if (this.applicationForm.valid && this.job) {
      this.applicationSubmitting = true;
      this.errorMessage = '';

      const applicationData = {
        job: this.job.id,
        ...this.applicationForm.value
      };

      this.applicationService.createApplication(applicationData).subscribe({
        next: (response) => {
          this.applicationSubmitting = false;
          this.applicationSuccess = true;
          this.showApplicationForm = false;
          setTimeout(() => {
            this.router.navigate(['/applications']);
          }, 2000);
        },
        error: (error) => {
          this.applicationSubmitting = false;
          this.errorMessage = error.error?.message || 'Failed to submit application. You may have already applied.';
        }
      });
    }
  }

  deleteJob() {
    if (this.job && confirm('Are you sure you want to delete this job?')) {
      this.jobService.deleteJob(this.job.id).subscribe({
        next: () => {
          this.router.navigate(['/jobs']);
        },
        error: (error) => {
          alert('Error deleting job: ' + (error.error?.message || 'Unknown error'));
        }
      });
    }
  }

  get canApply(): boolean {
    return this.authService.isCandidate && this.job?.status === 'open';
  }

  get isOwner(): boolean {
    return this.authService.currentUserValue?.id === this.job?.posted_by;
  }
}
