# ReferMe - Quick Start Guide

This guide will help you get the ReferMe job referral portal running quickly.

## ⚡ Quick Start (5 minutes)

### Step 1: Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Install dependencies (requires Python 3.8+)
pip install -r requirements.txt

# Note: For development, you can use SQLite instead of SQL Server
# Edit backend/config/settings.py and uncomment the SQLite database configuration

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Start the backend server
python manage.py runserver
```

Backend will be running at: **http://localhost:8000**

### Step 2: Frontend Setup (3 minutes)

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (requires Node.js 18+)
npm install

# Start the frontend server
ng serve
```

Frontend will be running at: **http://localhost:4200**

### Step 3: Use the Application

1. **Open your browser** and go to http://localhost:4200

2. **Sign up** as a new user:
   - Click "Sign Up"
   - Choose user type (Referrer or Candidate)
   - Fill in your details

3. **Explore the features**:
   - **As a Candidate**: Browse jobs, apply with cover letter
   - **As a Referrer**: Post jobs, review applications

## 🎯 Testing the Application

### Create Test Users

#### Referrer Account
- Username: `john_referrer`
- Email: `john@company.com`
- User Type: Referrer
- Company: Tech Corp

#### Candidate Account
- Username: `jane_candidate`
- Email: `jane@email.com`
- User Type: Candidate

### Test Workflow

1. **Login as Referrer** → Post a job
2. **Logout** → Login as Candidate
3. **Browse jobs** → Apply for the posted job
4. **Logout** → Login as Referrer
5. **Go to Applications** → Update application status

## 📋 Common Issues & Solutions

### Issue: "Module not found" errors in backend
**Solution:**
```bash
pip install -r requirements.txt
```

### Issue: "ng: command not found"
**Solution:**
```bash
npm install -g @angular/cli
```

### Issue: Database errors (SQL Server)
**Solution:** Use SQLite for development:
- Edit `backend/config/settings.py`
- Uncomment the SQLite DATABASES configuration (lines ~90-95)
- Comment out the SQL Server configuration

### Issue: CORS errors
**Solution:**
- Ensure backend is running on port 8000
- Check `backend/config/settings.py` CORS_ALLOWED_ORIGINS includes `http://localhost:4200`

### Issue: Authentication not working
**Solution:**
- Clear browser localStorage
- Check both servers are running
- Verify API URL in `frontend/src/environments/environment.ts`

## 🔧 Development Tips

### Backend Admin Panel
Access Django admin at http://localhost:8000/admin
```bash
# Create admin user
python manage.py createsuperuser
```

### API Documentation
- Base URL: `http://localhost:8000/api`
- Auth endpoints: `/api/auth/`
- Job endpoints: `/api/jobs/`
- Application endpoints: `/api/applications/`

### Hot Reload
- Both servers support hot reload
- Backend: Automatically reloads on Python file changes
- Frontend: Automatically reloads on TypeScript/HTML/CSS changes

## 📱 Default Ports

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8000
- **Django Admin**: http://localhost:8000/admin

## 🎨 Features to Try

### For Candidates
1. ✅ Sign up with candidate user type
2. ✅ Browse job listings
3. ✅ Search and filter jobs
4. ✅ View job details
5. ✅ Apply with cover letter and resume link
6. ✅ Track application status
7. ✅ View personalized dashboard

### For Referrers
1. ✅ Sign up with referrer user type
2. ✅ Post a new job with all details
3. ✅ View all posted jobs
4. ✅ Review received applications
5. ✅ Update application status
6. ✅ Add notes to applications
7. ✅ Edit/delete own jobs
8. ✅ View analytics dashboard

## 🚀 Next Steps

1. **Customize**: Modify colors, logos, and styling
2. **Add Features**: Email notifications, file uploads, etc.
3. **Deploy**: Follow the deployment guides in respective READMEs
4. **Test**: Write unit and integration tests

## 📚 Documentation

- **Main README**: `/README.md`
- **Backend README**: `/backend/README.md`
- **Frontend README**: `/frontend/README.md`

## 💡 Pro Tips

1. **Use VS Code**: Great for both Python and TypeScript
2. **Install Extensions**:
   - Python
   - Angular Language Service
   - Prettier
   - ESLint

3. **Keep Both Terminals Open**: One for backend, one for frontend

4. **Check Browser Console**: For frontend debugging

5. **Check Terminal Output**: For backend errors

## ⚠️ Important Notes

- **Default Credentials**: Never use default settings in production
- **Database**: SQLite is for development only
- **Security**: Change SECRET_KEY in production
- **CORS**: Configure properly for production domains

## 🎓 Learning Resources

- **Django REST**: https://www.django-rest-framework.org/
- **Angular**: https://angular.dev/
- **JWT Auth**: https://jwt.io/

---

**Need Help?** Check the detailed READMEs in each folder or open an issue!

Happy Coding! 🎉
