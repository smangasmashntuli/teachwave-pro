-- Create test users using Supabase Auth API (PREFERRED METHOD)
-- This creates proper auth users that will trigger the profile creation automatically

-- OPTION 1: Use Supabase Auth API (Recommended)
-- You should create these users through your app's signup page or via Supabase Auth API
-- Test emails: admin1@teachwave.com, admin2@teachwave.com, teacher1@teachwave.com, etc.
-- The trigger will automatically create profiles based on email patterns

-- OPTION 2: Create fake auth users for testing (TEMPORARY - for testing only)
-- WARNING: This bypasses normal auth flows and should only be used for development

-- Temporarily disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create fake auth users (this simulates what Supabase Auth would do)
WITH test_users AS (
  SELECT 
    gen_random_uuid() as id,
    email,
    full_name,
    role,
    phone,
    date_of_birth
  FROM (VALUES
    ('admin1@teachwave.com', 'Sarah Johnson', 'admin', '+1-555-0101', NULL),
    ('admin2@teachwave.com', 'Michael Chen', 'admin', '+1-555-0102', NULL),
    ('teacher1@teachwave.com', 'Dr. Emily Rodriguez', 'teacher', '+1-555-0201', NULL),
    ('teacher2@teachwave.com', 'Prof. James Wilson', 'teacher', '+1-555-0202', NULL),
    ('student1@teachwave.com', 'Alex Thompson', 'student', '+1-555-0301', '2008-05-15'::date),
    ('student2@teachwave.com', 'Maya Patel', 'student', '+1-555-0302', '2008-08-22'::date)
  ) AS t(email, full_name, role, phone, date_of_birth)
)
INSERT INTO profiles (id, email, full_name, role, phone, date_of_birth)
SELECT id, email, full_name, role::user_role, phone, date_of_birth
FROM test_users;

-- Create some teacher assignments
INSERT INTO teacher_assignments (teacher_id, subject_id)
SELECT 
    p.id as teacher_id,
    s.id as subject_id
FROM profiles p, subjects s
WHERE p.role = 'teacher' 
AND p.email = 'teacher1@teachwave.com'
AND s.code IN ('MATH10', 'MATH11');

INSERT INTO teacher_assignments (teacher_id, subject_id)
SELECT 
    p.id as teacher_id,
    s.id as subject_id  
FROM profiles p, subjects s
WHERE p.role = 'teacher'
AND p.email = 'teacher2@teachwave.com'
AND s.code IN ('ENG10', 'ENG11');

-- Create some student enrollments
INSERT INTO student_enrollments (student_id, grade_id)
SELECT 
    p.id as student_id,
    g.id as grade_id
FROM profiles p, grades g
WHERE p.role = 'student'
AND p.email = 'student1@teachwave.com' 
AND g.name = 'Grade 10';

INSERT INTO student_enrollments (student_id, grade_id)
SELECT 
    p.id as student_id,
    g.id as grade_id
FROM profiles p, grades g  
WHERE p.role = 'student'
AND p.email = 'student2@teachwave.com'
AND g.name = 'Grade 10';

-- Re-enable RLS after testing
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify the test data
SELECT 
    p.full_name,
    p.email, 
    p.role,
    CASE 
        WHEN p.role = 'student' THEN (
            SELECT g.name 
            FROM student_enrollments se 
            JOIN grades g ON se.grade_id = g.id 
            WHERE se.student_id = p.id 
            LIMIT 1
        )
        WHEN p.role = 'teacher' THEN (
            SELECT string_agg(s.name, ', ') 
            FROM teacher_assignments ta 
            JOIN subjects s ON ta.subject_id = s.id 
            WHERE ta.teacher_id = p.id
        )
        ELSE 'N/A'
    END as assignments
FROM profiles p
ORDER BY p.role, p.full_name;