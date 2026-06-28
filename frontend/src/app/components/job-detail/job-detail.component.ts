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

  selectedResumeBlob: string | null = null;
  selectedResumeFilename: string | null = null;

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
      resume_url: [''],
      linkedin_url: [''],
      portfolio_url: [''],
      github_url: ['']
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

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedResumeFilename = file.name;
      const reader = new FileReader();
      reader.onload = () => {
        this.selectedResumeBlob = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile() {
    this.selectedResumeBlob = null;
    this.selectedResumeFilename = null;
  }

  submitApplication() {
    if (this.applicationForm.invalid) {
      this.applicationForm.markAllAsTouched();
      return;
    }

    if (!this.selectedResumeBlob && !this.applicationForm.value.resume_url) {
      this.errorMessage = 'Please upload a resume file or provide a resume link.';
      return;
    }

    if (this.job) {
      this.applicationSubmitting = true;
      this.errorMessage = '';

      const applicationData = {
        job: this.job.id,
        cover_letter: this.applicationForm.value.cover_letter,
        resume_url: this.applicationForm.value.resume_url || undefined,
        resume_blob: this.selectedResumeBlob || undefined,
        resume_filename: this.selectedResumeFilename || undefined,
        linkedin_url: this.applicationForm.value.linkedin_url || undefined,
        portfolio_url: this.applicationForm.value.portfolio_url || undefined,
        github_url: this.applicationForm.value.github_url || undefined
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
          this.errorMessage = error.error?.message || error.error?.detail || 'Failed to submit application. You may have already applied.';
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
