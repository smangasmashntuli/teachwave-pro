-- Fix for circular dependency in RLS policies
-- Run this to fix the teacher_assignments policy recursion issue

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Teachers can view their students" ON profiles;
DROP POLICY IF EXISTS "Teachers can view grades they teach" ON grades;
DROP POLICY IF EXISTS "Students can view their subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can view assigned subjects" ON subjects;
DROP POLICY IF EXISTS "Students can view enrollments in assigned subjects" ON student_enrollments;

-- Recreate policies without circular dependencies

-- Simpler policy for teachers to view students (without teacher_assignments check)
CREATE POLICY "Teachers can view students" ON profiles FOR SELECT 
    USING (
        role = 'student' AND 
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

-- Teachers can view all grades (simplified)
CREATE POLICY "Teachers can view grades" ON grades FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Students can view all subjects in their grade
CREATE POLICY "Students can view subjects" ON subjects FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM student_enrollments se
        WHERE se.student_id = auth.uid() AND se.grade_id = subjects.grade_id
    ));

-- Teachers can view all subjects
CREATE POLICY "Teachers can view subjects" ON subjects FOR SELECT
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher'));

-- Students can view their enrollments
CREATE POLICY "Students can view enrollments" ON student_enrollments FOR SELECT
    USING (student_id = auth.uid());