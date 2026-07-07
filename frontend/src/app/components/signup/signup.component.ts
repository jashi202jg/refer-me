import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  errorMessage: string = '';
  isLoading: boolean = false;
  companies: { id: number; name: string; website?: string }[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.signupForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.workEmailValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password2: ['', Validators.required],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      user_type: ['candidate', Validators.required],
      phone: [''],
      company: [''],
      custom_company: ['']
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Read type parameter to pre-select role
    this.route.queryParams.subscribe(params => {
      const type = params['type'];
      if (type === 'candidate' || type === 'referrer') {
        this.signupForm.patchValue({ user_type: type });
      }
    });

    // Re-validate email when user_type changes
    this.signupForm.get('user_type')?.valueChanges.subscribe(() => {
      this.signupForm.get('email')?.updateValueAndValidity();
    });

    // Load companies list from backend
    this.authService.getCompanies().subscribe({
      next: (list) => {
        this.companies = list;
      },
      error: (err) => {
        console.error('Failed to load companies', err);
      }
    });
  }

  workEmailValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.value;
    if (!email) return null;

    const parent = control.parent;
    if (parent) {
      const userType = parent.get('user_type')?.value;
      if (userType === 'referrer') {
        const parts = email.split('@');
        if (parts.length > 1) {
          const emailDomain = parts[1].toLowerCase().trim();
          const blockedDomains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
            'aol.com', 'icloud.com', 'protonmail.com', 'zoho.com', 
            'yandex.com', 'mail.com', 'live.com', 'msn.com', 'gmx.com'
          ];
          if (blockedDomains.includes(emailDomain)) {
            return { 'workEmailOnly': true };
          }
        }
      }
    }
    return null;
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

    const formValue = { ...this.signupForm.value };

    // Custom company validation for referrers
    if (formValue.user_type === 'referrer') {
      if (!formValue.company) {
        this.errorMessage = 'Please select a company.';
        return;
      }
      if (formValue.company === 'Other') {
        if (!formValue.custom_company || !formValue.custom_company.trim()) {
          this.errorMessage = 'Please specify your company name.';
          return;
        }
        formValue.company = formValue.custom_company.trim();
      }
    } else {
      formValue.company = '';
    }

    delete formValue.custom_company;

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.signup(formValue).subscribe({
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
