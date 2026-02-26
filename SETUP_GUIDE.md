# TeachWave MySQL Setup Guide

## Prerequisites

- Node.js 18+ installed
- MySQL 8.0+ installed and running
- MySQL Workbench or command-line access to MySQL

## Setup Instructions

### 1. Configure MySQL Database

1. **Start MySQL Server**
   - Make sure MySQL is running on your system
   - Default port: 3306

2. **Create the Database and Tables**
   
   Open MySQL Workbench or MySQL command-line and run:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   
   Or manually execute the SQL file contents in your MySQL client.

### 2. Configure Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file with your MySQL credentials:**
   ```env
   # MySQL Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=teachwave
   DB_PORT=3306

   # JWT Secret (change this to a random string)
   JWT_SECRET=your_super_secret_jwt_key_change_me

   # Server Configuration
   PORT=3001
   VITE_API_URL=http://localhost:3001/api
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Application

**Option 1: Run both frontend and backend together (Recommended)**
```bash
npm run dev:all
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

### 5. Access the Application

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3001/api
- **Health Check:** http://localhost:3001/api/health

## Default Users

The database schema creates a default admin account:

- **Email:** admin@teachwave.com
- **Password:** Admin123!

You can create new users through the signup page.

## Testing the Setup

1. **Test Database Connection:**
   - Start the backend server
   - Check console for "✅ Database connected successfully"

2. **Test API:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   Should return: `{"status":"ok","message":"TeachWave API is running"}`

3. **Test Login:**
   - Go to http://localhost:8080/login
   - Use default admin credentials or sign up as a new user

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires token)
- `POST /api/auth/logout` - Logout

### Student Endpoints (requires student role)
- `GET /api/student/dashboard` - Get dashboard stats
- `GET /api/student/subjects` - Get enrolled subjects
- `GET /api/student/assignments` - Get assignments

### Teacher Endpoints (requires teacher role)
- `GET /api/teacher/dashboard` - Get dashboard stats
- `GET /api/teacher/subjects` - Get assigned subjects
- `POST /api/teacher/assignments` - Create assignment

### Admin Endpoints (requires admin role)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/stats` - Get system statistics

## Database Schema

The system includes the following main tables:

- `users` - All user accounts
- `students` - Student-specific data
- `teachers` - Teacher-specific data
- `grades` - Grade levels (8-12)
- `subjects` - Available subjects
- `subject_groups` - Subject streams (Science, Accounting, Humanities)
- `student_enrollments` - Student grade enrollments
- `subject_enrollments` - Student subject enrollments
- `teacher_assignments` - Teacher-subject assignments
- `assignments` - Assignment details
- `assignment_submissions` - Student submissions
- `virtual_classes` - Virtual classroom sessions
- `attendance` - Attendance records

## Troubleshooting

### Database Connection Issues

1. **Check MySQL is running:**
   ```bash
   # Windows
   net start MySQL80
   
   # Linux/Mac
   sudo systemctl status mysql
   ```

2. **Verify credentials:**
   - Make sure username and password in `.env` match your MySQL installation

3. **Check port:**
   - Default MySQL port is 3306
   - Verify it's not being used by another application

### Backend Server Issues

1. **Port already in use:**
   - Change PORT in `.env` to a different value (e.g., 3002)

2. **Module not found errors:**
   - Run `npm install` again
   - Delete `node_modules` and run `npm install`

### Frontend Issues

1. **API connection errors:**
   - Verify backend server is running
   - Check VITE_API_URL in `.env` matches backend port

## Additional Features to Implement

The current implementation provides:
- ✅ User authentication (JWT)
- ✅ Role-based access control
- ✅ Student, Teacher, and Admin dashboards
- ✅ Basic API endpoints

Future enhancements could include:
- Subject enrollment system
- Assignment submission
- Virtual classroom integration
- File upload for assignments
- Grading system
- Attendance tracking
- Real-time notifications

## Support

For issues or questions:
1. Check the logs in the terminal
2. Verify all environment variables are set correctly
3. Ensure MySQL database is properly initialized
