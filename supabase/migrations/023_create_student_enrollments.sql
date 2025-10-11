-- Create student enrollments for existing students
-- This will allow students to see assignments and content from teachers

BEGIN;

-- First, let's get our student and some subjects to enroll them in
-- We'll enroll the student in a reasonable course load (6 subjects)

DO $$
DECLARE
    student_id_val UUID;
    subject_record RECORD;
    enrollment_count INTEGER := 0;
BEGIN
    -- Get the first student ID
    SELECT id INTO student_id_val 
    FROM profiles 
    WHERE role = 'student' 
    LIMIT 1;
    
    -- Check if we found a student
    IF student_id_val IS NULL THEN
        RAISE NOTICE 'No students found in the system';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Enrolling student ID: %', student_id_val;
    
    -- Enroll student in first 6 subjects (reasonable course load)
    FOR subject_record IN (
        SELECT id, name, code 
        FROM subjects 
        ORDER BY created_at 
        LIMIT 6
    ) LOOP
        -- Insert enrollment
        INSERT INTO subject_enrollments (
            student_id,
            subject_id,
            is_active,
            enrollment_date,
            created_at,
            updated_at
        ) VALUES (
            student_id_val,
            subject_record.id,
            TRUE,
            NOW(),
            NOW(),
            NOW()
        ) ON CONFLICT (student_id, subject_id) DO NOTHING;
        
        enrollment_count := enrollment_count + 1;
        RAISE NOTICE 'Enrolled in: % (%)', subject_record.name, subject_record.code;
    END LOOP;
    
    RAISE NOTICE 'Created % enrollments for student', enrollment_count;
END $$;

COMMIT;

-- Verify the enrollments were created
SELECT 
    p.full_name as student_name,
    s.name as subject_name,
    s.code as subject_code,
    se.enrollment_date,
    se.is_active
FROM subject_enrollments se
JOIN profiles p ON se.student_id = p.id
JOIN subjects s ON se.subject_id = s.id
WHERE p.role = 'student'
ORDER BY se.enrollment_date DESC;