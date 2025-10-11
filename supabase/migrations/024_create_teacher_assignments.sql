-- Create teacher assignments for existing teachers
-- This will allow teachers to upload content and create assignments

BEGIN;

DO $$
DECLARE
    teacher_id_val UUID;
    subject_record RECORD;
    assignment_count INTEGER := 0;
BEGIN
    -- Get the first teacher ID
    SELECT id INTO teacher_id_val 
    FROM profiles 
    WHERE role = 'teacher' 
    LIMIT 1;
    
    -- Check if we found a teacher
    IF teacher_id_val IS NULL THEN
        RAISE NOTICE 'No teachers found in the system';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Assigning subjects to teacher ID: %', teacher_id_val;
    
    -- Assign teacher to first 4 subjects (reasonable teaching load)
    FOR subject_record IN (
        SELECT id, name, code 
        FROM subjects 
        ORDER BY created_at 
        LIMIT 4
    ) LOOP
        -- Insert teacher assignment
        INSERT INTO teacher_assignments (
            teacher_id,
            subject_id,
            is_active,
            assigned_date,
            created_at,
            updated_at
        ) VALUES (
            teacher_id_val,
            subject_record.id,
            TRUE,
            NOW(),
            NOW(),
            NOW()
        ) ON CONFLICT (teacher_id, subject_id) DO UPDATE SET
            is_active = TRUE,
            updated_at = NOW();
        
        assignment_count := assignment_count + 1;
        RAISE NOTICE 'Assigned to teach: % (%)', subject_record.name, subject_record.code;
    END LOOP;
    
    RAISE NOTICE 'Created % teacher assignments', assignment_count;
END $$;

COMMIT;

-- Verify the teacher assignments were created
SELECT 
    p.full_name as teacher_name,
    s.name as subject_name,
    s.code as subject_code,
    ta.assigned_date,
    ta.is_active
FROM teacher_assignments ta
JOIN profiles p ON ta.teacher_id = p.id
JOIN subjects s ON ta.subject_id = s.id
WHERE p.role = 'teacher'
ORDER BY ta.assigned_date DESC;