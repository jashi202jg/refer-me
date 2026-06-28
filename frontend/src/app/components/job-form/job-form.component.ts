import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { JobService } from '../../services/job.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-job-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: './job-form.component.html',
  styleUrls: ['./job-form.component.css']
})
export class JobFormComponent implements OnInit {
  jobForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  isEditMode = false;
  jobId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.jobForm = this.fb.group({
      title: ['', Validators.required],
      company: ['', Validators.required],
      location: ['', Validators.required],
      job_type: ['full_time', Validators.required],
      description: ['', [Validators.required, Validators.minLength(50)]],
      experience_required: [''],
      salary_range: [''],
      skills_required: ['', Validators.required],
      status: ['open']
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEditMode = true;
      this.jobId = +id;
      this.loadJobData(this.jobId);
    }
  }

  loadJobData(id: number) {
    this.jobService.getJobById(id).subscribe({
      next: (job) => {
        this.jobForm.patchValue({
          title: job.title,
          company: job.company,
          location: job.location,
          job_type: job.job_type,
          description: job.description,
          experience_required: job.experience_required,
          salary_range: job.salary_range,
          skills_required: job.skills_required,
          status: job.status
        });
      },
      error: (error) => {
        console.error('Error loading job details for editing:', error);
        this.errorMessage = 'Failed to load job details.';
      }
    });
  }

  onSubmit() {
    if (this.jobForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      if (this.isEditMode && this.jobId) {
        this.jobService.updateJob(this.jobId, this.jobForm.value).subscribe({
          next: (job) => {
            this.isSubmitting = false;
            this.router.navigate(['/jobs', job.id]);
          },
          error: (error) => this.handleError(error)
        });
      } else {
        this.jobService.createJob(this.jobForm.value).subscribe({
          next: (job) => {
            this.isSubmitting = false;
            this.router.navigate(['/jobs', job.id]);
          },
          error: (error) => this.handleError(error)
        });
      }
    }
  }

  private handleError(error: any) {
    this.isSubmitting = false;
    this.errorMessage = error.error?.message || 'Operation failed. Please try again.';
    if (error.error) {
      Object.keys(error.error).forEach(key => {
        if (key !== 'message' && this.jobForm.get(key)) {
          this.jobForm.get(key)?.setErrors({ server: error.error[key] });
        }
      });
    }
  }

  get f() {
    return this.jobForm.controls;
  }
}
