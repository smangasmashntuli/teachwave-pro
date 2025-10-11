-- Debug: Check actual table structure for student_enrollments and subject_enrollments
-- Run this first to see what columns exist in the tables

-- Check student_enrollments table structure
DO $$
BEGIN
  RAISE NOTICE 'Checking student_enrollments table structure...';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'student_enrollments'
ORDER BY ordinal_position;

-- Check subject_enrollments table structure
DO $$
BEGIN
  RAISE NOTICE 'Checking subject_enrollments table structure...';
END $$;

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subject_enrollments'
ORDER BY ordinal_position;

-- Check current data counts
DO $$
BEGIN
  RAISE NOTICE 'Current data counts:';
  RAISE NOTICE 'Students: %', (SELECT COUNT(*) FROM profiles WHERE role = 'student');
  RAISE NOTICE 'Teachers: %', (SELECT COUNT(*) FROM profiles WHERE role = 'teacher');
  RAISE NOTICE 'Subjects: %', (SELECT COUNT(*) FROM subjects);
  RAISE NOTICE 'Subject Groups: %', (SELECT COUNT(*) FROM subject_groups);
  RAISE NOTICE 'Student enrollments (grade/group): %', (SELECT COUNT(*) FROM student_enrollments);
  RAISE NOTICE 'Subject enrollments: %', (SELECT COUNT(*) FROM subject_enrollments);
  RAISE NOTICE 'Teacher assignments: %', (SELECT COUNT(*) FROM teacher_assignments);
END $$;