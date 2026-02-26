# TeachWave Database Schema - South African CAPS Curriculum

## Overview
Complete MySQL database schema for TeachWave Pro, aligned with the South African Curriculum and Assessment Policy Statement (CAPS) for Grades 8-12.

## 📋 Database Structure

### Roles
- **Admin**: Full system control
- **Teacher**: Assigned to specific subjects and grades
- **Student**: Enrolled in one grade and stream

---

## 🎓 Grade & Stream Structure

### Grades 8-9 (General Education)
**All students take the same 9 subjects:**
- IsiZulu HL
- English FAL
- Life Orientation
- EMS (Economic and Management Sciences)
- Natural Science
- History
- Mathematics
- Technology
- CAT (Computer Applications Technology)

### Grades 10-12 (FET Phase - Six Streams)

#### 1. **Humanities Stream**
- IsiZulu HL
- English FAL
- Life Orientation
- History
- Geography
- Mathematical Literacy
- Life Sciences

#### 2. **Science Stream**
- IsiZulu HL
- English FAL
- Life Orientation
- Mathematics
- Geography
- Life Sciences
- Physical Science

#### 3. **Tourism Stream**
- IsiZulu HL
- English FAL
- Life Orientation
- Tourism
- History
- Life Sciences
- Mathematical Literacy

#### 4. **Accounting Stream**
- IsiZulu HL
- English FAL
- Life Orientation
- Accounting
- Mathematics
- Economics
- Business Studies

#### 5. **EGD Stream** (Engineering Graphics & Design)
- IsiZulu HL
- English FAL
- Life Orientation
- Technical Mathematics
- EGD
- Technical Science
- Civil Technology

#### 6. **IT Stream** (Information Technology)
- IsiZulu HL
- English FAL
- Life Orientation
- Information Technology
- Physical Science
- Mathematics
- Geography

---

## 🗄️ Database Tables

### Core Tables
1. **users** - All user accounts (admin, teachers, students)
2. **grades** - Grade levels (8, 9, 10, 11, 12)
3. **subject_groups** - Six streams (Humanities, Science, Tourism, Accounting, EGD, IT)
4. **subjects** - All 22 subjects
5. **subject_grade_mappings** - Which subjects are available for which grades
6. **subject_group_mappings** - Which subjects belong to which streams

### User Extension Tables
7. **students** - Student-specific data (linked to users)
8. **teachers** - Teacher-specific data (linked to users)
9. **student_enrollments** - Student grade and stream enrollment
10. **subject_enrollments** - Individual subject registrations
11. **teacher_assignments** - Teacher-subject-grade assignments

### Learning Activity Tables
12. **assignments** - Homework/tasks assigned by teachers
13. **assignment_submissions** - Student submissions with grades
14. **virtual_classes** - Online class sessions
15. **attendance** - Student attendance tracking

---

## 📊 Data Flow

### Student Registration Flow
1. **Grades 8-9:**
   - Student selects Grade 8 or 9
   - System automatically enrolls them in all 9 mandatory subjects

2. **Grades 10-12:**
   - Student selects grade (10, 11, or 12)
   - Student selects ONE stream (Humanities/Science/Tourism/Accounting/EGD/IT)
   - System automatically enrolls them in the 7 subjects for that stream

### Teacher Assignment Flow
- **Admin-managed only**
- Admin assigns teachers to specific:
  - Subject (e.g., Mathematics)
  - Grade (e.g., Grade 11)
- One teacher can teach:
  - Multiple subjects
  - Multiple grades
  - Example: Mr. Smith teaches English (Grade 11 & 12) + Natural Science (Grade 9)

### Dashboard Visibility Rules

**Student Dashboard:**
- Only sees subjects they are enrolled in
- Only sees assignments for their subjects
- Only sees classes for their subjects

**Teacher Dashboard:**
- Only sees subjects they are assigned to
- Only sees students enrolled in those subjects
- Can create assignments and classes for their assigned subject-grade combinations

**Admin Dashboard:**
- Full visibility across all grades, streams, subjects
- Can manage all users (create, edit, delete)
- Can assign/reassign teachers
- Can correct student enrollments

---

## 🚀 Setup Instructions

### 1. Create Database
```bash
mysql -u root -p
```

### 2. Run Schema File
```bash
mysql -u root -p < database/schema.sql
```

This will:
- ✅ Create teachwave database
- ✅ Create all 15 tables
- ✅ Insert all 5 grades
- ✅ Insert all 6 subject groups/streams
- ✅ Insert all 22 subjects
- ✅ Map subjects to grades
- ✅ Map subjects to streams
- ✅ Create default admin user
- ✅ Create default teacher
- ✅ Assign default teacher to all Grade 8 subjects


---

## 🔐 Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt (10 rounds)
2. **Role-Based Access**: Enforced at database and API level
3. **Foreign Key Constraints**: Data integrity maintained
4. **Unique Constraints**: Prevents duplicate enrollments
5. **Cascade Deletes**: Maintains referential integrity

---

## 📝 Key Business Rules

### Student Rules
- ✅ Can only register for ONE grade at a time
- ✅ Grades 10-12 students MUST select ONE stream
- ✅ Grades 8-9 get all subjects automatically
- ✅ Can only see their own subjects and assignments

### Teacher Rules
- ✅ Assigned by admin only (cannot self-assign)
- ✅ Can teach multiple subjects across multiple grades
- ✅ Can only see students in their assigned subjects
- ✅ Can create assignments for their assigned subject-grade combinations

### Admin Rules
- ✅ Full CRUD on all users
- ✅ Full control over teacher assignments
- ✅ Can correct student enrollments
- ✅ Can view all system data

---

## 🔄 Future Enhancements

### Phase 2 (Suggested)
- [ ] Grade progression system (automatic rollover to next grade)
- [ ] Report card generation
- [ ] Parent accounts and access
- [ ] SMS notifications for assignments/classes
- [ ] Mobile app integration
- [ ] Bulk import for students/teachers
- [ ] Academic year management
- [ ] Subject performance analytics

### Phase 3 (Advanced)
- [ ] AI-powered assignment grading
- [ ] Video lesson library
- [ ] Peer collaboration tools
- [ ] Gamification and badges
- [ ] Integration with Department of Education APIs
- [ ] Multi-school support (tenant isolation)

---

## 📞 Support

For issues or questions about the database schema, refer to:
- `database/schema.sql` - Full SQL schema
- `SETUP_GUIDE.md` - Complete setup guide
- `README.md` - Project overview

---

**Last Updated:** February 26, 2026  
**Version:** 1.0  
**Curriculum Compliance:** CAPS (South African National Curriculum)
