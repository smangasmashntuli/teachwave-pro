-- Simple migration to fix student content access
-- Run this manually in Supabase SQL Editor if needed

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Students can view published content for their subjects" ON learning_content;

-- Create corrected policy using the actual subject_enrollments table
CREATE POLICY "Students can view published content for their enrolled subjects" ON learning_content FOR SELECT
    USING (
        is_published = true AND
        EXISTS (
            SELECT 1 
            FROM subject_enrollments se
            WHERE se.student_id = auth.uid() 
              AND se.is_active = true
              AND se.subject_id = learning_content.subject_id
        )
    );

-- Add comment for clarity
COMMENT ON POLICY "Students can view published content for their enrolled subjects" ON learning_content 
IS 'Allow students to view published learning content for subjects they are directly enrolled in via subject_enrollments table';