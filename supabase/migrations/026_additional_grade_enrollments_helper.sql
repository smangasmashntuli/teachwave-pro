-- Helper migration: Create additional grade-specific enrollments
-- Use this AFTER the main 025_create_student_enrollments.sql migration
-- This script shows how to enroll students in different grades and streams

-- Example 1: Enroll a student in Grade 10 Science Stream (7 subjects)
-- Uncomment and modify the student email to use:
/*
INSERT INTO student_enrollments (student_id, grade_id, subject_group_id, enrollment_date, is_active, created_at, updated_at)
SELECT 
  p.id as student_id,
  g.id as grade_id,
  sg.id as subject_group_id,
  NOW() as enrollment_date,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM 
  profiles p
  CROSS JOIN grades g
  CROSS JOIN subject_groups sg
WHERE 
  p.email = 'student@example.com'  -- Change this to actual student email
  AND g.name = 'Grade 10'
  AND sg.name = 'Grade 10 Science'
  AND NOT EXISTS (
    SELECT 1 FROM student_enrollments se 
    WHERE se.student_id = p.id AND se.is_active = true
  );
*/

-- Example 2: Enroll a student in Grade 11 Accounting Stream (7 subjects)  
-- Uncomment and modify the student email to use:
/*
INSERT INTO student_enrollments (student_id, grade_id, subject_group_id, enrollment_date, is_active, created_at, updated_at)
SELECT 
  p.id as student_id,
  g.id as grade_id,
  sg.id as subject_group_id,
  NOW() as enrollment_date,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM 
  profiles p
  CROSS JOIN grades g
  CROSS JOIN subject_groups sg
WHERE 
  p.email = 'student@example.com'  -- Change this to actual student email
  AND g.name = 'Grade 11'
  AND sg.name = 'Grade 11 Accounting'
  AND NOT EXISTS (
    SELECT 1 FROM student_enrollments se 
    WHERE se.student_id = p.id AND se.is_active = true
  );
*/

-- After creating student enrollment, create the subject enrollments:
-- Uncomment to use:
/*
INSERT INTO subject_enrollments (student_id, subject_id, enrollment_date, is_active, created_at, updated_at)
SELECT DISTINCT
  se.student_id,
  sga.subject_id,
  NOW() as enrollment_date,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM 
  student_enrollments se
  JOIN subject_groups sg ON se.subject_group_id = sg.id
  JOIN subject_group_assignments sga ON sg.id = sga.group_id
  JOIN profiles p ON se.student_id = p.id
WHERE 
  se.is_active = true
  AND p.email = 'student@example.com'  -- Change this to actual student email
  AND NOT EXISTS (
    SELECT 1 FROM subject_enrollments subje 
    WHERE subje.student_id = se.student_id AND subje.subject_id = sga.subject_id
  );
*/

-- Show available grades and subject groups for reference:
DO $$
DECLARE
  grade_group RECORD;
BEGIN
  RAISE NOTICE 'Available Grades and Subject Groups:';
  RAISE NOTICE '';
  
  FOR grade_group IN 
    SELECT 
      g.name as grade_name,
      sg.name as group_name,
      sg.description as group_description,
      COUNT(sga.subject_id) as subject_count
    FROM grades g
    JOIN subject_groups sg ON g.id = sg.grade_id
    LEFT JOIN subject_group_assignments sga ON sg.id = sga.group_id
    GROUP BY g.name, sg.name, sg.description, g.id
    ORDER BY g.id, sg.name
  LOOP
    RAISE NOTICE '%: % (% subjects)', 
      grade_group.grade_name, 
      grade_group.group_name,
      grade_group.subject_count;
    RAISE NOTICE '  Description: %', grade_group.group_description;
    RAISE NOTICE '';
  END LOOP;
END $$;

-- Show current students for reference:
DO $$
DECLARE
  student_info RECORD;
BEGIN
  RAISE NOTICE 'Current Students:';
  RAISE NOTICE '';
  
  FOR student_info IN 
    SELECT 
      p.email,
      p.full_name,
      CASE 
        WHEN se.id IS NOT NULL THEN 
          g.name || ' - ' || sg.name
        ELSE 
          'Not enrolled'
      END as current_enrollment
    FROM profiles p
    LEFT JOIN student_enrollments se ON p.id = se.student_id AND se.is_active = true
    LEFT JOIN grades g ON se.grade_id = g.id
    LEFT JOIN subject_groups sg ON se.subject_group_id = sg.id
    WHERE p.role = 'student'
    ORDER BY p.full_name
  LOOP
    RAISE NOTICE '% (%): %', 
      student_info.full_name,
      student_info.email, 
      student_info.current_enrollment;
  END LOOP;
END $$;