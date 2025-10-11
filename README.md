# 🎓 TeachWave Pro - Advanced E-Learning Platform

> A comprehensive, grade-aware e-learning platform built for the South African education system, supporting Grades 8-12 with real-time virtual classrooms, assignment management, and content delivery.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

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

### 🎥 **Real-Time Virtual Classrooms**
- **WebRTC Video Conferencing**: Live audio/video streaming
- **Screen Sharing**: Share desktop, applications, or browser tabs
- **Live Chat**: Real-time messaging during classes
- **Session Recording**: Capture classes for later review
- **Participant Management**: Monitor attendance and engagement

### 📝 **Assignment & Content Management**
- **Dynamic Assignment Creation**: Teachers create assignments with file attachments
- **Automated Grading**: Support for quizzes and structured assessments
- **File Upload System**: Secure storage for learning materials and submissions
- **Due Date Management**: Automated notifications and late submission handling

### 📊 **Analytics & Progress Tracking**
- **Student Performance Dashboard**: Grade tracking and progress visualization
- **Attendance Monitoring**: Automatic class attendance recording
- **Subject-wise Analytics**: Performance breakdown by subject and grade
- **Teacher Insights**: Class performance and engagement metrics

## 🏗️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks and concurrent features
- **TypeScript** - Type-safe development environment
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible UI components

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)** - Fine-grained access control
- **Real-time Subscriptions** - Live data updates
- **Supabase Storage** - File upload and management

### Real-Time Features
- **WebRTC** - Peer-to-peer video/audio communication
- **WebSocket** - Real-time chat and notifications
- **React Query** - Efficient data fetching and caching

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Supabase Account** for backend services
- **Modern Browser** with WebRTC support

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

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   
   In your Supabase Dashboard SQL Editor, run the migrations in order:
   ```sql
   -- Run each migration file in sequence:
   -- 1. supabase/migrations/001_initial_schema.sql
   -- 2. supabase/migrations/014_subject_groups_system.sql  
   -- 3. supabase/migrations/015_student_enrollments.sql
   -- 4. supabase/migrations/025_create_student_enrollments.sql
   ```

5. **Storage Setup**
   
   Run the storage bucket creation script:
   ```sql
   -- In Supabase SQL Editor:
   -- Execute: create-bucket.sql
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

7. **Access the Application**
   
   Open [http://localhost:5173](http://localhost:5173) in your browser

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

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

## 🗄️ Database Schema

### Core Tables

```sql
-- User profiles with role-based access
profiles (id, email, full_name, role, created_at)

-- Grade levels (8, 9, 10, 11, 12)
grades (id, name, description, academic_year)

-- Subjects by grade
subjects (id, name, code, grade_id, description)

-- Subject groups (streams)
subject_groups (id, name, description, grade_id)

-- Two-tier enrollment system
student_enrollments (student_id, grade_id, subject_group_id)
subject_enrollments (student_id, subject_id, enrollment_date)

-- Teacher assignments
teacher_assignments (teacher_id, subject_id, assigned_date)

-- Learning content and assignments
learning_content (id, title, content_type, file_url, subject_id)
assignments (id, title, instructions, due_date, subject_id)
```

### Key Relationships

```
Student → Grade → Subject Group → Individual Subjects
Teacher → Assigned Subjects → Content & Assignments
Admin → System-wide Management
```

## 🔐 Security Features

- **Row Level Security (RLS)** - Database-level access control
- **Grade Isolation** - Students only access their grade-level content
- **Role-based Permissions** - Strict separation of student/teacher/admin capabilities
- **Secure File Upload** - Validated file types and storage policies
- **Authentication** - Supabase Auth with email verification

## 📱 Browser Support

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
│   ├── admin/          # Admin-specific components
│   ├── student/        # Student dashboard components
│   ├── teacher/        # Teacher tools and interfaces
│   └── ui/             # Base UI components (shadcn/ui)
├── contexts/           # React contexts (Auth, etc.)
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility functions
├── pages/              # Main application pages
└── assets/             # Static assets

supabase/
├── migrations/         # Database migration files
└── config.toml        # Supabase configuration
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
