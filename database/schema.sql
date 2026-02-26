-- ============================================
-- TeachWave MySQL Database Schema
-- South African CAPS Curriculum (Grades 8-12)
-- ============================================

-- Create database
CREATE DATABASE IF NOT EXISTS teachwave;
USE teachwave;

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') NOT NULL,
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  date_of_birth DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Grades table (8-12)
CREATE TABLE IF NOT EXISTS grades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  academic_year VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subject groups/streams (for grades 10-12)
CREATE TABLE IF NOT EXISTS subject_groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subject-Grade mapping (which subjects are available for which grades)
CREATE TABLE IF NOT EXISTS subject_grade_mappings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  grade_id INT NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  UNIQUE KEY unique_subject_grade (subject_id, grade_id)
);

-- Subject-Group mapping (which subjects belong to which streams for grades 10-12)
CREATE TABLE IF NOT EXISTS subject_group_mappings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  subject_id INT NOT NULL,
  subject_group_id INT NOT NULL,
  grade_id INT NOT NULL,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_group_id) REFERENCES subject_groups(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  UNIQUE KEY unique_subject_group_grade (subject_id, subject_group_id, grade_id)
);

-- Students table (extends users)
CREATE TABLE IF NOT EXISTS students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  student_number VARCHAR(50) UNIQUE,
  grade_id INT,
  subject_group_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE SET NULL,
  FOREIGN KEY (subject_group_id) REFERENCES subject_groups(id) ON DELETE SET NULL
);

-- Teachers table (extends users)
CREATE TABLE IF NOT EXISTS teachers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  employee_number VARCHAR(50) UNIQUE,
  specialization TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Teacher subject assignments
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  teacher_id INT NOT NULL,
  subject_id INT NOT NULL,
  grade_id INT NOT NULL,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  UNIQUE KEY unique_teacher_subject_grade (teacher_id, subject_id, grade_id)
);

-- Student enrollments (grade level)
CREATE TABLE IF NOT EXISTS student_enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  grade_id INT NOT NULL,
  subject_group_id INT,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_group_id) REFERENCES subject_groups(id) ON DELETE SET NULL,
  UNIQUE KEY unique_student_grade (student_id, grade_id, is_active)
);

-- Subject enrollments (individual subjects)
CREATE TABLE IF NOT EXISTS subject_enrollments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  subject_id INT NOT NULL,
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_subject (student_id, subject_id)
);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  grade_id INT NOT NULL,
  due_date DATETIME,
  total_points INT DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
);

-- Assignment submissions
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  submission_text TEXT,
  file_url VARCHAR(500),
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  grade INT,
  feedback TEXT,
  graded_at TIMESTAMP,
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  UNIQUE KEY unique_assignment_submission (assignment_id, student_id)
);

-- Virtual classes
CREATE TABLE IF NOT EXISTS virtual_classes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  class_name VARCHAR(255) NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  grade_id INT NOT NULL,
  scheduled_start DATETIME NOT NULL,
  scheduled_end DATETIME,
  meeting_url VARCHAR(500),
  status ENUM('scheduled', 'live', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE CASCADE
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id INT PRIMARY KEY AUTO_INCREMENT,
  class_id INT NOT NULL,
  student_id INT NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL,
  join_time TIMESTAMP,
  leave_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES virtual_classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ============================================
-- DATA SEEDING
-- ============================================

-- Insert Grades (8-12)
INSERT INTO grades (id, name, description, academic_year) VALUES
(1, 'Grade 8', 'Grade 8 - General Education', '2026'),
(2, 'Grade 9', 'Grade 9 - General Education', '2026'),
(3, 'Grade 10', 'Grade 10 - FET Phase', '2026'),
(4, 'Grade 11', 'Grade 11 - FET Phase', '2026'),
(5, 'Grade 12', 'Grade 12 - Matric', '2026')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert Subject Groups/Streams (for Grades 10-12)
INSERT INTO subject_groups (id, name, code, description) VALUES
(1, 'Humanities', 'HUM', 'Arts and Humanities focused subjects'),
(2, 'Science', 'SCI', 'Science and Mathematics focused subjects'),
(3, 'Tourism', 'TOU', 'Tourism and Hospitality focused subjects'),
(4, 'Accounting', 'ACC', 'Business and Accounting focused subjects'),
(5, 'EGD', 'EGD', 'Engineering Graphics and Design focused subjects'),
(6, 'IT', 'IT', 'Information Technology focused subjects')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- INSERT SUBJECTS
-- ============================================

-- Common subjects for all streams
INSERT INTO subjects (id, name, code, description) VALUES
(1, 'IsiZulu HL', 'ZULU-HL', 'IsiZulu Home Language'),
(2, 'English FAL', 'ENG-FAL', 'English First Additional Language'),
(3, 'Life Orientation', 'LO', 'Life Orientation'),
(4, 'Mathematics', 'MATH', 'Mathematics'),
(5, 'Mathematical Literacy', 'MATH-LIT', 'Mathematical Literacy')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Grade 8-9 specific subjects
INSERT INTO subjects (id, name, code, description) VALUES
(6, 'EMS', 'EMS', 'Economic and Management Sciences'),
(7, 'Natural Science', 'NAT-SCI', 'Natural Sciences'),
(8, 'History', 'HIST', 'History'),
(9, 'Technology', 'TECH', 'Technology'),
(10, 'CAT', 'CAT', 'Computer Applications Technology')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Grade 10-12 specific subjects
INSERT INTO subjects (id, name, code, description) VALUES
(11, 'Geography', 'GEO', 'Geography'),
(12, 'Life Sciences', 'LIFE-SCI', 'Life Sciences'),
(13, 'Physical Science', 'PHYS-SCI', 'Physical Sciences'),
(14, 'Tourism', 'TOUR', 'Tourism'),
(15, 'Accounting', 'ACC', 'Accounting'),
(16, 'Economics', 'ECON', 'Economics'),
(17, 'Business Studies', 'BUS-STU', 'Business Studies'),
(18, 'Technical Mathematics', 'TECH-MATH', 'Technical Mathematics'),
(19, 'EGD', 'EGD', 'Engineering Graphics and Design'),
(20, 'Technical Science', 'TECH-SCI', 'Technical Sciences'),
(21, 'Civil Technology', 'CIV-TECH', 'Civil Technology'),
(22, 'Information Technology', 'IT', 'Information Technology')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- ============================================
-- GRADE 8 & 9 SUBJECT MAPPINGS
-- ============================================

-- Grade 8 subjects (all mandatory)
INSERT INTO subject_grade_mappings (subject_id, grade_id, is_mandatory) VALUES
(1, 1, TRUE),  -- IsiZulu HL
(2, 1, TRUE),  -- English FAL
(3, 1, TRUE),  -- Life Orientation
(6, 1, TRUE),  -- EMS
(7, 1, TRUE),  -- Natural Science
(8, 1, TRUE),  -- History
(4, 1, TRUE),  -- Mathematics
(9, 1, TRUE),  -- Technology
(10, 1, TRUE)  -- CAT
ON DUPLICATE KEY UPDATE is_mandatory=VALUES(is_mandatory);

-- Grade 9 subjects (same as Grade 8)
INSERT INTO subject_grade_mappings (subject_id, grade_id, is_mandatory) VALUES
(1, 2, TRUE),  -- IsiZulu HL
(2, 2, TRUE),  -- English FAL
(3, 2, TRUE),  -- Life Orientation
(6, 2, TRUE),  -- EMS
(7, 2, TRUE),  -- Natural Science
(8, 2, TRUE),  -- History
(4, 2, TRUE),  -- Mathematics
(9, 2, TRUE),  -- Technology
(10, 2, TRUE)  -- CAT
ON DUPLICATE KEY UPDATE is_mandatory=VALUES(is_mandatory);

-- ============================================
-- GRADE 10-12 STREAM MAPPINGS
-- ============================================

-- Humanities Stream: IsiZulu HL, English FAL, LO, History, Geography, Mathematical Literacy, Life Sciences
INSERT INTO subject_group_mappings (subject_id, subject_group_id, grade_id) VALUES
-- Grade 10 Humanities
(1, 1, 3), (2, 1, 3), (3, 1, 3), (8, 1, 3), (11, 1, 3), (5, 1, 3), (12, 1, 3),
-- Grade 11 Humanities
(1, 1, 4), (2, 1, 4), (3, 1, 4), (8, 1, 4), (11, 1, 4), (5, 1, 4), (12, 1, 4),
-- Grade 12 Humanities
(1, 1, 5), (2, 1, 5), (3, 1, 5), (8, 1, 5), (11, 1, 5), (5, 1, 5), (12, 1, 5)
ON DUPLICATE KEY UPDATE subject_id=VALUES(subject_id);

-- Science Stream: IsiZulu HL, English FAL, LO, Mathematics, Geography, Life Sciences, Physical Science
INSERT INTO subject_group_mappings (subject_id, subject_group_id, grade_id) VALUES
-- Grade 10 Science
(1, 2, 3), (2, 2, 3), (3, 2, 3), (4, 2, 3), (11, 2, 3), (12, 2, 3), (13, 2, 3),
-- Grade 11 Science
(1, 2, 4), (2, 2, 4), (3, 2, 4), (4, 2, 4), (11, 2, 4), (12, 2, 4), (13, 2, 4),
-- Grade 12 Science
(1, 2, 5), (2, 2, 5), (3, 2, 5), (4, 2, 5), (11, 2, 5), (12, 2, 5), (13, 2, 5)
ON DUPLICATE KEY UPDATE subject_id=VALUES(subject_id);

-- Tourism Stream: IsiZulu HL, English FAL, LO, Tourism, History, Life Sciences, Mathematical Literacy
INSERT INTO subject_group_mappings (subject_id, subject_group_id, grade_id) VALUES
-- Grade 10 Tourism
(1, 3, 3), (2, 3, 3), (3, 3, 3), (14, 3, 3), (8, 3, 3), (12, 3, 3), (5, 3, 3),
-- Grade 11 Tourism
(1, 3, 4), (2, 3, 4), (3, 3, 4), (14, 3, 4), (8, 3, 4), (12, 3, 4), (5, 3, 4),
-- Grade 12 Tourism
(1, 3, 5), (2, 3, 5), (3, 3, 5), (14, 3, 5), (8, 3, 5), (12, 3, 5), (5, 3, 5)
ON DUPLICATE KEY UPDATE subject_id=VALUES(subject_id);

-- Accounting Stream: IsiZulu HL, English FAL, LO, Accounting, Mathematics, Economics, Business Studies
INSERT INTO subject_group_mappings (subject_id, subject_group_id, grade_id) VALUES
-- Grade 10 Accounting
(1, 4, 3), (2, 4, 3), (3, 4, 3), (15, 4, 3), (4, 4, 3), (16, 4, 3), (17, 4, 3),
-- Grade 11 Accounting
(1, 4, 4), (2, 4, 4), (3, 4, 4), (15, 4, 4), (4, 4, 4), (16, 4, 4), (17, 4, 4),
-- Grade 12 Accounting
(1, 4, 5), (2, 4, 5), (3, 4, 5), (15, 4, 5), (4, 4, 5), (16, 4, 5), (17, 4, 5)
ON DUPLICATE KEY UPDATE subject_id=VALUES(subject_id);

-- EGD Stream: IsiZulu HL, English FAL, LO, Technical Mathematics, EGD, Technical Science, Civil Technology
INSERT INTO subject_group_mappings (subject_id, subject_group_id, grade_id) VALUES
-- Grade 10 EGD
(1, 5, 3), (2, 5, 3), (3, 5, 3), (18, 5, 3), (19, 5, 3), (20, 5, 3), (21, 5, 3),
-- Grade 11 EGD
(1, 5, 4), (2, 5, 4), (3, 5, 4), (18, 5, 4), (19, 5, 4), (20, 5, 4), (21, 5, 4),
-- Grade 12 EGD
(1, 5, 5), (2, 5, 5), (3, 5, 5), (18, 5, 5), (19, 5, 5), (20, 5, 5), (21, 5, 5)
ON DUPLICATE KEY UPDATE subject_id=VALUES(subject_id);

-- IT Stream: IsiZulu HL, English FAL, LO, Information Technology, Physical Science, Mathematics, Geography
INSERT INTO subject_group_mappings (subject_id, subject_group_id, grade_id) VALUES
-- Grade 10 IT
(1, 6, 3), (2, 6, 3), (3, 6, 3), (22, 6, 3), (13, 6, 3), (4, 6, 3), (11, 6, 3),
-- Grade 11 IT
(1, 6, 4), (2, 6, 4), (3, 6, 4), (22, 6, 4), (13, 6, 4), (4, 6, 4), (11, 6, 4),
-- Grade 12 IT
(1, 6, 5), (2, 6, 5), (3, 6, 5), (22, 6, 5), (13, 6, 5), (4, 6, 5), (11, 6, 5)
ON DUPLICATE KEY UPDATE subject_id=VALUES(subject_id);

-- ============================================
-- DEFAULT USERS
-- ============================================

-- Default Admin User (password: Admin123!)
INSERT INTO users (id, email, password, full_name, role) VALUES
(1, 'admin@teachwave.com', '$2a$10$VlUcHoYXojYINvtLUgZ1kuP3GVj6BDUS2/We1SXYDegZ7fWf43AOC', 'System Administrator', 'admin')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Default Teacher (password: Teacher123!)
INSERT INTO users (id, email, password, full_name, role, phone) VALUES
(2, 'teacher@teachwave.com', '$2a$10$dhdOFex/aWvxe95toPHNauMIdyhsUioNhMlx6RaSqbK/7Ru3SYq/y', 'Mr. Default Teacher', 'teacher', '0123456789')
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Create teacher record
INSERT INTO teachers (id, user_id, employee_number, specialization) VALUES
(1, 2, 'TCH001', 'Grade 8 General Education')
ON DUPLICATE KEY UPDATE user_id=VALUES(user_id);

-- ============================================
-- ASSIGN DEFAULT TEACHER TO GRADE 8 SUBJECTS
-- ============================================

INSERT INTO teacher_assignments (teacher_id, subject_id, grade_id) VALUES
(1, 1, 1),  -- IsiZulu HL - Grade 8
(1, 2, 1),  -- English FAL - Grade 8
(1, 3, 1),  -- Life Orientation - Grade 8
(1, 4, 1),  -- Mathematics - Grade 8
(1, 6, 1),  -- EMS - Grade 8
(1, 7, 1),  -- Natural Science - Grade 8
(1, 8, 1),  -- History - Grade 8
(1, 9, 1),  -- Technology - Grade 8
(1, 10, 1)  -- CAT - Grade 8
ON DUPLICATE KEY UPDATE teacher_id=VALUES(teacher_id);
