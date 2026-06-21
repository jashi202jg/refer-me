import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JobService } from '../../services/job.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-job-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NavbarComponent],
  templateUrl: './job-form.component.html',
  styleUrls: ['./job-form.component.css']
})
export class JobFormComponent {
  jobForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private jobService: JobService,
    private router: Router
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

  onSubmit() {
    if (this.jobForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      this.jobService.createJob(this.jobForm.value).subscribe({
        next: (job) => {
          this.isSubmitting = false;
          this.router.navigate(['/jobs', job.id]);
        },
        error: (error) => {
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Failed to create job. Please try again.';
          if (error.error) {
            Object.keys(error.error).forEach(key => {
              if (key !== 'message' && this.jobForm.get(key)) {
                this.jobForm.get(key)?.setErrors({ server: error.error[key] });
              }
            });
          }
        }
      });
    }
  }

  get f() {
    return this.jobForm.controls;
  }
}
