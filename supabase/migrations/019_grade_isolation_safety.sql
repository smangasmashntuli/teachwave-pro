-- Grade Isolation Safety Migration
-- This migration adds additional constraints and validations to ensure strict grade isolation

-- Create a function to validate subject-grade consistency
CREATE OR REPLACE FUNCTION validate_grade_isolation()
RETURNS TRIGGER AS $$
BEGIN
    -- For virtual_classes: ensure teacher is assigned to the subject they're creating classes for
    IF TG_TABLE_NAME = 'virtual_classes' THEN
        IF NOT EXISTS (
            SELECT 1 FROM teacher_assignments ta
            WHERE ta.teacher_id = NEW.teacher_id 
            AND ta.subject_id = NEW.subject_id 
            AND ta.is_active = true
        ) THEN
            RAISE EXCEPTION 'Teacher % is not assigned to subject %', NEW.teacher_id, NEW.subject_id;
        END IF;
    END IF;

    -- For learning_content: ensure teacher is assigned to the subject they're uploading to
    IF TG_TABLE_NAME = 'learning_content' THEN
        IF NOT EXISTS (
            SELECT 1 FROM teacher_assignments ta
            WHERE ta.teacher_id = NEW.teacher_id 
            AND ta.subject_id = NEW.subject_id 
            AND ta.is_active = true
        ) THEN
            RAISE EXCEPTION 'Teacher % is not assigned to subject %', NEW.teacher_id, NEW.subject_id;
        END IF;
    END IF;

    -- For assignments: ensure teacher is assigned to the subject
    IF TG_TABLE_NAME = 'assignments' THEN
        IF NOT EXISTS (
            SELECT 1 FROM teacher_assignments ta
            WHERE ta.teacher_id = NEW.teacher_id 
            AND ta.subject_id = NEW.subject_id 
            AND ta.is_active = true
        ) THEN
            RAISE EXCEPTION 'Teacher % is not assigned to subject %', NEW.teacher_id, NEW.subject_id;
        END IF;
    END IF;

    -- For subject_enrollments: prevent students from enrolling in subjects from different grades
    IF TG_TABLE_NAME = 'subject_enrollments' THEN
        -- Check if student is already enrolled in a different grade
        IF EXISTS (
            SELECT 1 FROM subject_enrollments se
            JOIN subjects s1 ON se.subject_id = s1.id
            JOIN subjects s2 ON s2.id = NEW.subject_id
            WHERE se.student_id = NEW.student_id 
            AND se.is_active = true
            AND s1.grade_id != s2.grade_id
            AND se.id != COALESCE(NEW.id, uuid_generate_v4()) -- Exclude current record for updates
        ) THEN
            DECLARE
                existing_grade TEXT;
                new_grade TEXT;
            BEGIN
                -- Get grade names for better error message
                SELECT g.name INTO existing_grade 
                FROM subject_enrollments se 
                JOIN subjects s ON se.subject_id = s.id 
                JOIN grades g ON s.grade_id = g.id
                WHERE se.student_id = NEW.student_id AND se.is_active = true
                LIMIT 1;

                SELECT g.name INTO new_grade
                FROM subjects s
                JOIN grades g ON s.grade_id = g.id
                WHERE s.id = NEW.subject_id;

                RAISE EXCEPTION 'Student cannot be enrolled in multiple grades. Currently enrolled in %, attempting to enroll in %', existing_grade, new_grade;
            END;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to enforce grade isolation
DROP TRIGGER IF EXISTS validate_virtual_class_grade_isolation ON virtual_classes;
CREATE TRIGGER validate_virtual_class_grade_isolation
    BEFORE INSERT OR UPDATE ON virtual_classes
    FOR EACH ROW
    EXECUTE FUNCTION validate_grade_isolation();

DROP TRIGGER IF EXISTS validate_learning_content_grade_isolation ON learning_content;
CREATE TRIGGER validate_learning_content_grade_isolation
    BEFORE INSERT OR UPDATE ON learning_content
    FOR EACH ROW
    EXECUTE FUNCTION validate_grade_isolation();

DROP TRIGGER IF EXISTS validate_assignments_grade_isolation ON assignments;
CREATE TRIGGER validate_assignments_grade_isolation
    BEFORE INSERT OR UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_grade_isolation();

DROP TRIGGER IF EXISTS validate_subject_enrollment_grade_isolation ON subject_enrollments;
CREATE TRIGGER validate_subject_enrollment_grade_isolation
    BEFORE INSERT OR UPDATE ON subject_enrollments
    FOR EACH ROW
    EXECUTE FUNCTION validate_grade_isolation();

-- Create a view for grade-isolated teacher subjects
CREATE OR REPLACE VIEW teacher_subjects_with_grades AS
SELECT 
    ta.teacher_id,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    s.description as subject_description,
    g.id as grade_id,
    g.name as grade_name,
    g.academic_year,
    ta.assigned_date,
    ta.is_active,
    -- Add grade info to subject name for clarity
    CONCAT(s.name, ' - ', g.name) as full_subject_name
FROM teacher_assignments ta
JOIN subjects s ON ta.subject_id = s.id
JOIN grades g ON s.grade_id = g.id
WHERE ta.is_active = true;

-- Create a view for grade-isolated student subjects  
CREATE OR REPLACE VIEW student_subjects_with_grades AS
SELECT 
    se.student_id,
    s.id as subject_id,
    s.name as subject_name,
    s.code as subject_code,
    s.description as subject_description,
    g.id as grade_id,
    g.name as grade_name,
    g.academic_year,
    se.enrollment_date,
    se.is_active,
    -- Add grade info to subject name for clarity
    CONCAT(s.name, ' - ', g.name) as full_subject_name
FROM subject_enrollments se
JOIN subjects s ON se.subject_id = s.id
JOIN grades g ON s.grade_id = g.id
WHERE se.is_active = true;

-- Create indexes for better performance on grade-based queries
CREATE INDEX IF NOT EXISTS idx_subjects_grade_id ON subjects(grade_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_subject ON teacher_assignments(teacher_id, subject_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_student_subject ON subject_enrollments(student_id, subject_id) WHERE is_active = true;

-- Add a comment to document the grade isolation strategy
COMMENT ON TABLE subjects IS 'Subjects are grade-specific. Each subject belongs to exactly one grade, ensuring content isolation.';
COMMENT ON TABLE teacher_assignments IS 'Teachers are assigned to specific subject-grade combinations, not just subject names.';
COMMENT ON TABLE subject_enrollments IS 'Students are enrolled in specific subject-grade combinations within their grade level.';

-- Create a function to get grade-safe content
CREATE OR REPLACE FUNCTION get_grade_safe_content(user_id UUID, user_role TEXT)
RETURNS TABLE (
    content_id UUID,
    title TEXT,
    subject_name TEXT,
    grade_name TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    IF user_role = 'teacher' THEN
        RETURN QUERY
        SELECT 
            lc.id,
            lc.title,
            s.name,
            g.name,
            lc.file_url,
            lc.created_at
        FROM learning_content lc
        JOIN subjects s ON lc.subject_id = s.id
        JOIN grades g ON s.grade_id = g.id
        JOIN teacher_assignments ta ON ta.subject_id = s.id
        WHERE ta.teacher_id = user_id 
        AND ta.is_active = true
        AND lc.is_published = true
        ORDER BY lc.created_at DESC;
    ELSE
        RETURN QUERY
        SELECT 
            lc.id,
            lc.title,
            s.name,
            g.name,
            lc.file_url,
            lc.created_at
        FROM learning_content lc
        JOIN subjects s ON lc.subject_id = s.id
        JOIN grades g ON s.grade_id = g.id
        JOIN subject_enrollments se ON se.subject_id = s.id
        WHERE se.student_id = user_id 
        AND se.is_active = true
        AND lc.is_published = true
        ORDER BY lc.created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_grade_safe_content TO authenticated;
GRANT SELECT ON teacher_subjects_with_grades TO authenticated;
GRANT SELECT ON student_subjects_with_grades TO authenticated;