# ReferMe Frontend - Job Referral Portal

Angular-based frontend application for the job referral portal.

## Features

- **User Authentication**
  - JWT-based authentication
  - Signup with user type selection (Referrer/Candidate)
  - Secure login/logout
  
- **Two User Types**
  - **Referrers**: Can post jobs and manage applications
  - **Candidates**: Can browse and apply for jobs

- **Job Management**
  - Browse job listings with search and filters
  - View detailed job information
  - Post new jobs (Referrers only)
  - Edit/delete own jobs (Referrers only)

- **Application Management**
  - Apply for jobs with cover letter and resume (Candidates)
  - View application status
  - Manage received applications (Referrers)
  - Update application status (Referrers)

- **Dashboard**
  - Personalized dashboard for each user type
  - Quick access to recent jobs/applications
  - Statistics and overview

## Prerequisites

- Node.js 18+ and npm
- Angular CLI (`npm install -g @angular/cli`)

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure API endpoint:
   - Update `src/environments/environment.ts` if backend runs on a different URL
   - Default is `http://localhost:8000/api`

## Development Server

Run the development server:
```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

## Build

Build the project for production:
```bash
ng build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/         # All UI components
│   │   │   ├── signup/        # User registration
│   │   │   ├── login/         # User login
│   │   │   ├── dashboard/     # Main dashboard
│   │   │   ├── job-list/      # Job listings
│   │   │   ├── job-detail/    # Job details & apply
│   │   │   ├── job-form/      # Post/edit jobs
│   │   │   ├── applications/  # Application management
│   │   │   └── navbar/        # Navigation bar
│   │   ├── guards/            # Route guards
│   │   │   ├── auth.guard.ts       # Auth protection
│   │   │   ├── referrer.guard.ts   # Referrer-only routes
│   │   │   └── candidate.guard.ts  # Candidate-only routes
│   │   ├── interceptors/      # HTTP interceptors
│   │   │   └── auth.interceptor.ts # JWT token injection
│   │   ├── models/            # TypeScript interfaces
│   │   │   ├── user.model.ts       # User types
│   │   │   └── job.model.ts        # Job & Application types
│   │   ├── services/          # API services
│   │   │   ├── auth.service.ts         # Authentication
│   │   │   ├── job.service.ts          # Job operations
│   │   │   └── application.service.ts  # Application operations
│   │   ├── app.routes.ts      # Route configuration
│   │   └── app.config.ts      # App configuration
│   ├── environments/          # Environment configs
│   └── styles.css            # Global styles
└── package.json              # Dependencies

```

## Key Routes

- `/signup` - User registration
- `/login` - User login
- `/dashboard` - Main dashboard (protected)
- `/jobs` - Job listings (protected)
- `/jobs/:id` - Job details (protected)
- `/post-job` - Post new job (referrer only)
- `/applications` - Application management (protected)

## Authentication Flow

1. User signs up or logs in
2. JWT access and refresh tokens are stored in localStorage
3. Auth interceptor automatically adds Bearer token to all API requests
4. Auth guard protects routes requiring authentication
5. User-specific guards protect role-based routes

## Technologies Used

- **Angular 17+** - Framework
- **TypeScript** - Programming language
- **RxJS** - Reactive programming
- **Angular Router** - Navigation
- **HttpClient** - API communication
- **CSS3** - Styling

## API Integration

The frontend communicates with the Django REST API:

- **Base URL**: `http://localhost:8000/api` (configurable in environment files)
- **Authentication**: JWT Bearer tokens
- **Endpoints**:
  - `/auth/signup/` - User registration
  - `/auth/login/` - User login
  - `/auth/profile/` - User profile
  - `/jobs/` - Job CRUD operations
  - `/applications/` - Application management

## Environment Configuration

### Development (`environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api'
};
```

### Production (`environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api'
};
```

## Troubleshooting

### CORS Issues
- Ensure the backend CORS configuration includes `http://localhost:4200`
- Check that the backend is running on port 8000

### Authentication Errors
- Check that JWT tokens are being stored in localStorage
- Verify the backend authentication endpoints are accessible
- Clear browser cache and localStorage if issues persist

### API Connection Issues
- Verify the `apiUrl` in environment files matches your backend URL
- Check that the backend server is running
- Inspect network requests in browser developer tools
