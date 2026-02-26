# 🎓 TeachWave Pro - Advanced E-Learning Platform

> A comprehensive, grade-aware e-learning platform built for the South African education system, supporting Grades 8-12 with MySQL database backend, JWT authentication, and role-based access control.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=flat&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)

## 🌟 Features

### 👥 **Multi-Role System**
- **Students**: Grade-specific dashboard, subject enrollment, assignment submission
- **Teachers**: Content creation, assignment management, virtual classrooms  
- **Administrators**: User management, subject group administration, analytics

### 📚 **Grade-Aware Education System**
- **Grades 8-9**: 9 core subjects automatically assigned
- **Grades 10-12**: Stream selection (Science, Accounting, Humanities) with 7 subjects each
- **South African Curriculum Compliance**: CAPS-aligned subject groups and progression
- **Grade Isolation**: Students only see content relevant to their grade level

### 🔒 **Authentication & Security**
- JWT-based authentication
- Role-based access control (Student/Teacher/Admin)
- Secure password hashing with bcrypt
- Protected API endpoints

### 📊 **Dashboard Features**
- **Student Dashboard**: Track enrolled subjects, assignments, and attendance
- **Teacher Dashboard**: Manage subjects, create assignments, view students
- **Admin Dashboard**: System overview, user management, statistics

## 🏗️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components
- **Axios** - HTTP client for API requests
- **React Router** - Client-side routing

### Backend
- **Node.js & Express** - REST API server
- **MySQL 8.0** - Relational database
- **JWT** - Token-based authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-origin resource sharing

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **MySQL** 8.0+ installed and running
- **Modern Browser** with JavaScript enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/smangasmashntuli/teachwave-pro.git
   cd teachwave-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up MySQL Database**
   
   Open MySQL and run:
   ```bash
   mysql -u root -p < database/schema.sql
   ```
   
   This creates:
   - `teachwave` database
   - All required tables
   - Default grades (8-12)
   - Subject groups
   - Default admin user

4. **Configure Environment Variables**
   
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your MySQL credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=teachwave
   DB_PORT=3306
   
   JWT_SECRET=change_this_to_random_secret_key
   PORT=3001
   VITE_API_URL=http://localhost:3001/api
   ```

5. **Start the Application**
   
   **Option 1: Run both frontend and backend** (Recommended)
   ```bash
   npm run dev:all
   ```
   
   **Option 2: Run separately**
   ```bash
   # Terminal 1 - Backend
   npm run server
   
   # Terminal 2 - Frontend
   npm run dev
   ```

6. **Access the Application**
   
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001/api
   - Health Check: http://localhost:3001/api/health

## 👤 Default Login

**Admin Account:**
- Email: `admin@teachwave.com`
- Password: `Admin123!`

You can also create new accounts through the signup page.

## 📁 Project Structure

```
teachwave-pro/
├── src/                      # Frontend source code
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   │   ├── api.ts          # API service layer
│   │   └── utils.ts        # Helper functions
│   ├── pages/              # Application pages
│   │   ├── Index.tsx       # Landing page
│   │   ├── Login.tsx       # Login page
│   │   ├── Signup.tsx      # Signup page
│   │   ├── StudentDashboard.tsx
│   │   ├── TeacherDashboard.tsx
│   │   └── AdminDashboard.tsx
│   └── App.tsx             # Main app component
│
├── server/                  # Backend source code
│   ├── config/             # Configuration files
│   │   └── database.js     # MySQL connection
│   ├── middleware/         # Express middleware
│   │   └── auth.js         # JWT authentication
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── student.js      # Student endpoints
│   │   ├── teacher.js      # Teacher endpoints
│   │   └── admin.js        # Admin endpoints
│   └── index.js            # Express server entry
│
├── database/               # Database files
│   └── schema.sql         # MySQL schema
│
├── .env.example           # Environment variables template
├── package.json           # Dependencies
└── SETUP_GUIDE.md        # Detailed setup instructions
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires token)
- `POST /api/auth/logout` - Logout

### Student (Requires student role)
- `GET /api/student/dashboard` - Dashboard statistics
- `GET /api/student/subjects` - Enrolled subjects
- `GET /api/student/assignments` - Assignments list

### Teacher (Requires teacher role)
- `GET /api/teacher/dashboard` - Dashboard statistics
- `GET /api/teacher/subjects` - Assigned subjects
- `POST /api/teacher/assignments` - Create assignment

### Admin (Requires admin role)
- `GET /api/admin/users` - All users list
- `GET /api/admin/stats` - System statistics

## 💾 Database Schema

### Main Tables

- **users** - User accounts with roles
- **students** - Student-specific data
- **teachers** - Teacher-specific data
- **grades** - Grade levels (8-12)
- **subjects** - Available subjects
- **subject_groups** - Subject streams
- **student_enrollments** - Grade enrollments
- **subject_enrollments** - Subject enrollments
- **teacher_assignments** - Teacher-subject assignments
- **assignments** - Assignment details
- **assignment_submissions** - Student submissions
- **virtual_classes** - Virtual classroom sessions
- **attendance** - Attendance records

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start frontend (Vite)
npm run server       # Start backend (Express)
npm run dev:all      # Start both frontend and backend
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

## 📱 Browser Support

- **Chrome/Edge** 90+
- **Firefox** 88+
- **Safari** 14+
- **Mobile Browsers** - iOS Safari, Chrome MobileThe only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## 📖 Usage Guide

### For Students

1. **Registration & Enrollment**
   - Sign up with your student credentials
   - Select your current grade (8-12)
   - Choose subject group/stream (for Grades 10-12)
   - System automatically enrolls you in appropriate subjects

2. **Dashboard Navigation**
   - View enrolled subjects and upcoming classes
   - Access assignments and submit work
   - Check grades and performance analytics
   - Join virtual classrooms for live lessons

### For Teachers

1. **Subject Assignment**
   - Admin assigns subjects to teachers
   - Teachers gain access to assigned subject dashboards
   - Create and manage learning content

2. **Content Creation**
   - Upload learning materials (PDFs, videos, presentations)
   - Create assignments with rubrics and due dates
   - Set up virtual classroom sessions

3. **Class Management**
   - Start live virtual classrooms
   - Enable camera, microphone, and screen sharing
   - Monitor student attendance and participation
   - Record sessions for later access

### For Administrators

1. **User Management**
   - Create and manage student/teacher accounts
   - Assign teachers to subjects
   - Monitor system usage and performance

2. **Subject Group Administration**
   - Manage grade levels and subject groups
   - Configure curriculum streams (Science, Accounting, Humanities)
   - Oversee student enrollments

##  Browser Support

- **Chrome/Edge** 90+ (Recommended for WebRTC)
- **Firefox** 88+
- **Safari** 14+
- **Mobile Browsers** - Limited WebRTC support

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Project Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # Base UI components (shadcn/ui)
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── pages/              # Main application pages
└── assets/             # Static assets
```

## 🚀 Deployment

### Build and Deploy

```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting provider
# Supported: Vercel, Netlify, AWS S3, etc.
```

### Recommended Hosting

- **Vercel** - Automatic deployments from Git
- **Netlify** - Easy static site hosting
- **AWS S3 + CloudFront** - Enterprise-grade hosting

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation Issues**: Open a GitHub issue
- **Feature Requests**: Use GitHub Discussions
- **Bug Reports**: Provide detailed reproduction steps

---

**Built with ❤️ for South African Education**

*Transforming learning experiences through technology, one classroom at a time.*
