-- Migration: Create grade-aware student enrollments to fix teacher-student content visibility
-- This fixes the issue where students cannot see assignments/materials uploaded by teachers
-- because they are not enrolled in any subjects.
-- 
-- GRADE-SPECIFIC ENROLLMENT RULES:
-- Grade 8-9: Enroll in core subjects (9 subjects total)
-- Grade 10-12: Enroll based on chosen stream (7 subjects total)

-- First, let's see what we have
DO $$
BEGIN
  RAISE NOTICE 'Current state before enrollments:';
  RAISE NOTICE 'Students: %', (SELECT COUNT(*) FROM profiles WHERE role = 'student');
  RAISE NOTICE 'Teachers: %', (SELECT COUNT(*) FROM profiles WHERE role = 'teacher');
  RAISE NOTICE 'Subjects: %', (SELECT COUNT(*) FROM subjects);
  RAISE NOTICE 'Subject Groups: %', (SELECT COUNT(*) FROM subject_groups);
  RAISE NOTICE 'Current student enrollments (grade/group): %', (SELECT COUNT(*) FROM student_enrollments);
  RAISE NOTICE 'Current subject enrollments: %', (SELECT COUNT(*) FROM subject_enrollments);
  RAISE NOTICE 'Teacher assignments: %', (SELECT COUNT(*) FROM teacher_assignments);
END $$;

-- Temporarily disable RLS to create initial enrollments
ALTER TABLE student_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE subject_enrollments DISABLE ROW LEVEL SECURITY;

-- Step 1: Create student grade/group enrollments (one per student)
-- For demo purposes, enroll students in Grade 8 Core first
INSERT INTO student_enrollments (student_id, grade_id, subject_group_id, enrollment_date, is_active)
SELECT 
  p.id as student_id,
  g.id as grade_id,
  sg.id as subject_group_id,
  NOW() as enrollment_date,
  true as is_active
FROM 
  profiles p
  CROSS JOIN grades g
  CROSS JOIN subject_groups sg
WHERE 
  p.role = 'student'
  AND g.name = 'Grade 8'  -- Start with Grade 8 for demo
  AND sg.name = 'Grade 8 Core'  -- Grade 8 core subjects
  AND NOT EXISTS (
    -- Avoid duplicates if some enrollments already exist
    SELECT 1 FROM student_enrollments se 
    WHERE se.student_id = p.id AND se.is_active = true
  );

-- Step 2: Create individual subject enrollments based on the grade/group enrollment
-- This creates the actual subject-level access that enables content visibility
INSERT INTO subject_enrollments (student_id, subject_id, enrollment_date, is_active)
SELECT DISTINCT
  se.student_id,
  sga.subject_id,
  NOW() as enrollment_date,
  true as is_active
FROM 
  student_enrollments se
  JOIN subject_groups sg ON se.subject_group_id = sg.id
  JOIN subject_group_assignments sga ON sg.id = sga.group_id
WHERE 
  se.is_active = true
  AND NOT EXISTS (
    -- Avoid duplicates if some subject enrollments already exist
    SELECT 1 FROM subject_enrollments subje 
    WHERE subje.student_id = se.student_id AND subje.subject_id = sga.subject_id
  );

-- Re-enable RLS
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_enrollments ENABLE ROW LEVEL SECURITY;

-- Show the results
DO $$
BEGIN
  RAISE NOTICE 'Results after creating enrollments:';
  RAISE NOTICE 'Student grade/group enrollments: %', (SELECT COUNT(*) FROM student_enrollments);
  RAISE NOTICE 'Individual subject enrollments: %', (SELECT COUNT(*) FROM subject_enrollments);
  RAISE NOTICE 'Students with grade enrollments: %', (SELECT COUNT(DISTINCT student_id) FROM student_enrollments);
  RAISE NOTICE 'Students with subject enrollments: %', (SELECT COUNT(DISTINCT student_id) FROM subject_enrollments);
  RAISE NOTICE 'Subjects with enrolled students: %', (SELECT COUNT(DISTINCT subject_id) FROM subject_enrollments);
END $$;

-- Verify Grade 8 Core enrollment (should be 9 subjects per student)
DO $$
DECLARE
  enrollment_sample RECORD;
  subject_count INTEGER;
BEGIN
  RAISE NOTICE 'Grade 8 Core Enrollment Details:';
  
  -- Show subject count per student
  FOR enrollment_sample IN 
    SELECT 
      p.full_name as student_name,
      COUNT(se.subject_id) as subject_count
    FROM student_enrollments ste
    JOIN profiles p ON ste.student_id = p.id
    JOIN subject_groups sg ON ste.subject_group_id = sg.id
    LEFT JOIN subject_enrollments se ON ste.student_id = se.student_id
    WHERE sg.name = 'Grade 8 Core'
    GROUP BY p.id, p.full_name
  LOOP
    RAISE NOTICE '  - %: % subjects enrolled', 
      enrollment_sample.student_name, 
      enrollment_sample.subject_count;
  END LOOP;
  
  -- Show sample subjects
  RAISE NOTICE 'Sample Grade 8 subjects enrolled:';
  FOR enrollment_sample IN 
    SELECT 
      p.full_name as student_name,
      s.name as subject_name,
      s.code as subject_code
    FROM subject_enrollments se
    JOIN profiles p ON se.student_id = p.id
    JOIN subjects s ON se.subject_id = s.id
    WHERE s.code LIKE '%_8'  -- Grade 8 subjects
    LIMIT 5
  LOOP
    RAISE NOTICE '  - % enrolled in % (%)', 
      enrollment_sample.student_name, 
      enrollment_sample.subject_name,
      enrollment_sample.subject_code;
  END LOOP;
END $$;

-- Important notes about the enrollment system
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📚 ENROLLMENT SYSTEM NOTES:';
  RAISE NOTICE '  • Grade 8-9: Enrolled in 9 core subjects automatically';
  RAISE NOTICE '  • Grade 10-12: Students choose streams (Science/Accounting/Humanities)';  
  RAISE NOTICE '  • Each stream has 7 subjects total';
  RAISE NOTICE '  • Students can change grades but maintain their chosen stream';
  RAISE NOTICE '  • This migration creates Grade 8 Core for demo purposes';
  RAISE NOTICE '  • Use StudentGroupSelection component for proper enrollment';
END $$;