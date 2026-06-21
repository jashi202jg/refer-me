# ReferMe Backend - Job Referral Portal API

Django REST API backend for the job referral portal.

## Features

- User authentication (JWT-based)
- Two user types: Referrer (Job Poster) and Candidate
- Job posting management
- Job application management
- SQL Server database integration

## Setup

1. Install Python 3.8+ (required)

2. Create a virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # On Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure database:
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`
   - Ensure SQL Server is running and accessible

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create superuser (optional):
```bash
python manage.py createsuperuser
```

7. Run the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - Register new user
- `POST /api/auth/login/` - Login and get JWT tokens
- `POST /api/auth/token/refresh/` - Refresh access token

### Jobs
- `GET /api/jobs/` - List all jobs
- `POST /api/jobs/` - Create new job (Referrer only)
- `GET /api/jobs/{id}/` - Get job details
- `PUT /api/jobs/{id}/` - Update job (Owner only)
- `DELETE /api/jobs/{id}/` - Delete job (Owner only)

### Applications
- `GET /api/applications/` - List user's applications
- `POST /api/applications/` - Apply for a job (Candidate only)
- `GET /api/applications/{id}/` - Get application details
- `PUT /api/applications/{id}/status/` - Update application status (Referrer only)

## User Types

- **Referrer**: Can post jobs and manage applications
- **Candidate**: Can apply for jobs and track applications
