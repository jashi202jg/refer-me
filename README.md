# ReferMe - Job Referral Portal

A complete job referral platform connecting job seekers with referrers. Built with Angular frontend and Django REST Framework backend.

## 🚀 Overview

ReferMe is a comprehensive web application that facilitates job referrals by connecting two types of users:
- **Referrers**: Professionals who can post job opportunities and refer qualified candidates
- **Candidates**: Job seekers looking for opportunities through referrals

## ✨ Features

### For Candidates
- Browse available job openings with advanced search and filters
- View detailed job descriptions, requirements, and company information
- Apply for jobs with cover letters and resume links
- Track application status in real-time
- Personalized dashboard with application history

### For Referrers
- Post job opportunities with detailed descriptions
- Manage job postings (edit, close, delete)
- Review applications from candidates
- Update application status (pending, reviewing, shortlisted, referred, rejected)
- Add internal notes to applications
- Dashboard with analytics on posted jobs and applications

### General Features
- Secure JWT-based authentication
- Role-based access control
- Responsive design for mobile and desktop
- Real-time status updates
- Search and filter capabilities
- User profile management

## 🏗️ Technology Stack

### Backend
- **Django 4.2** - Web framework
- **Django REST Framework** - API framework
- **SQL Server** - Primary database
- **Simple JWT** - Authentication
- **Django CORS Headers** - CORS handling
- **Python 3.8+**

### Frontend
- **Angular 17+** - Frontend framework
- **TypeScript** - Programming language
- **RxJS** - Reactive programming
- **CSS3** - Styling
- **Angular Router** - Navigation

## 📁 Project Structure

```
refer-me/
├── backend/                 # Django REST API
│   ├── accounts/           # User authentication & management
│   ├── jobs/              # Job and application management
│   ├── config/            # Django project settings
│   ├── requirements.txt   # Python dependencies
│   └── README.md          # Backend documentation
│
└── frontend/              # Angular application
    ├── src/
    │   ├── app/
    │   │   ├── components/    # UI components
    │   │   ├── services/      # API services
    │   │   ├── guards/        # Route guards
    │   │   ├── interceptors/  # HTTP interceptors
    │   │   └── models/        # TypeScript interfaces
    │   └── environments/  # Environment configs
    ├── package.json       # Node dependencies
    └── README.md          # Frontend documentation
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 18+ and npm
- SQL Server (or use SQLite for development)
- Angular CLI: `npm install -g @angular/cli`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. Install Python dependencies:
```bash
pip install -r requirements.txt
```

4. Configure the database:
```bash
# Copy the example environment file
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Edit .env and update database credentials
```

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

7. Start the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the development server:
```bash
ng serve
```

The application will be available at `http://localhost:4200/`

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup/` - Register a new user
- `POST /api/auth/login/` - Login and receive JWT tokens
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/profile/` - Get user profile
- `PATCH /api/auth/profile/` - Update user profile

### Job Endpoints
- `GET /api/jobs/` - List all jobs (with filters)
- `POST /api/jobs/` - Create a new job (referrer only)
- `GET /api/jobs/{id}/` - Get job details
- `PUT /api/jobs/{id}/` - Update job (owner only)
- `DELETE /api/jobs/{id}/` - Delete job (owner only)

### Application Endpoints
- `GET /api/applications/` - List applications
- `POST /api/applications/` - Create an application (candidate only)
- `GET /api/applications/{id}/` - Get application details
- `PATCH /api/applications/{id}/` - Update application status (referrer only)
- `DELETE /api/applications/{id}/` - Delete application (candidate only)

## 🎯 Usage

### For Job Seekers (Candidates)

1. **Sign Up**
   - Visit the signup page
   - Select "Candidate" as user type
   - Fill in your details and create an account

2. **Browse Jobs**
   - Explore available job listings
   - Use search and filters to find relevant opportunities
   - View detailed job descriptions

3. **Apply**
   - Click on a job to view details
   - Submit your application with a cover letter
   - Provide a link to your resume
   - Track your application status on the dashboard

### For Job Posters (Referrers)

1. **Sign Up**
   - Visit the signup page
   - Select "Referrer" as user type
   - Fill in your details including company information

2. **Post a Job**
   - Navigate to "Post Job"
   - Fill in job details (title, description, requirements, etc.)
   - Add required skills (comma-separated)
   - Publish the job

3. **Manage Applications**
   - View all applications received
   - Review candidate details, cover letters, and resumes
   - Update application status (reviewing, shortlisted, referred, rejected)
   - Add internal notes for tracking

## 🔒 Security Features

- JWT-based authentication with refresh tokens
- Password hashing and validation
- CORS protection
- Role-based access control
- Secure HTTP-only token storage
- SQL injection prevention through ORM
- XSS protection

## 🎨 UI Features

- Clean and modern interface
- Responsive design for all devices
- Intuitive navigation
- Color-coded status badges
- Real-time form validation
- Loading states and error handling
- Smooth transitions and animations

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
ng test
```

## 📦 Deployment

### Backend Deployment

1. Update `DEBUG = False` in settings
2. Configure production database
3. Set up environment variables
4. Run `python manage.py collectstatic`
5. Deploy to your preferred platform (AWS, Heroku, etc.)

### Frontend Deployment

1. Update `environment.prod.ts` with production API URL
2. Build for production: `ng build --configuration=production`
3. Deploy the `dist/` folder to your hosting service

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is for educational/portfolio purposes.

## 👥 Authors

Created as a full-stack MVP demonstration project.

## 🐛 Known Issues

- Resume upload functionality uses URL links instead of direct file upload
- Application editing is limited (candidates cannot edit after submission)
- No email notifications for status updates

## 🔮 Future Enhancements

- Email notifications for application updates
- Direct file upload for resumes
- Real-time chat between referrers and candidates
- Advanced analytics dashboard
- Interview scheduling system
- Candidate skill assessments
- Company profiles and ratings
- Application deadline tracking
- Multi-language support

## 📧 Support

For issues or questions, please open an issue in the repository.

---

**Note**: Make sure both backend and frontend servers are running for the full application to work. The backend must be running on port 8000 and the frontend on port 4200 (default ports).
