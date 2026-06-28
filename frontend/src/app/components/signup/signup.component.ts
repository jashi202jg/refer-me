import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password2: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      user_type: ['candidate', Validators.required],
      phone: [''],
      company: ['']
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('password2')?.value
      ? null : { 'mismatch': true };
  }

  onSubmit() {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.signup(this.signupForm.value).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.isLoading = false;
        const errBody = error.error;
        
        if (typeof errBody === 'string') {
          this.errorMessage = errBody;
        } else if (errBody && typeof errBody === 'object') {
          let hasFieldErrors = false;
          Object.keys(errBody).forEach(key => {
            if (!['detail', 'non_field_errors', 'message'].includes(key)) {
              const control = this.signupForm.get(key);
              if (control) {
                const fieldErr = Array.isArray(errBody[key]) ? errBody[key].join(' ') : errBody[key];
                control.setErrors({ server: fieldErr });
                control.markAsTouched();
                hasFieldErrors = true;
              }
            }
          });

          if (errBody.detail) {
            this.errorMessage = errBody.detail;
          } else if (errBody.non_field_errors) {
            this.errorMessage = Array.isArray(errBody.non_field_errors) 
              ? errBody.non_field_errors.join(' ') 
              : errBody.non_field_errors;
          } else if (errBody.message) {
            this.errorMessage = errBody.message;
          } else if (hasFieldErrors) {
            this.errorMessage = 'Please fix the highlighted errors below.';
          } else {
            this.errorMessage = 'Signup failed. Please try again.';
          }
        } else {
          this.errorMessage = 'Signup failed. Please try again.';
        }
      }
    });
  }

  get f() {
    return this.signupForm.controls;
  }
}
