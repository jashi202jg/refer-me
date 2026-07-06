import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { TermsComponent } from './components/terms/terms.component';
import { PrivacyComponent } from './components/privacy/privacy.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { JobListComponent } from './components/job-list/job-list.component';
import { JobDetailComponent } from './components/job-detail/job-detail.component';
import { JobFormComponent } from './components/job-form/job-form.component';
import { ApplicationsComponent } from './components/applications/applications.component';
import { authGuard } from './guards/auth.guard';
import { referrerGuard } from './guards/referrer.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'privacy', component: PrivacyComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'jobs', component: JobListComponent, canActivate: [authGuard] },
  { path: 'jobs/:id', component: JobDetailComponent, canActivate: [authGuard] },
  { path: 'jobs/:id/edit', component: JobFormComponent, canActivate: [authGuard, referrerGuard] },
  { path: 'post-job', component: JobFormComponent, canActivate: [authGuard, referrerGuard] },
  { path: 'applications', component: ApplicationsComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
