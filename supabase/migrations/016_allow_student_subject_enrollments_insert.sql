-- Migration: Allow students to insert/update/delete their own subject_enrollments
-- This fixes the RLS violation where a trigger that enrolls a student in group subjects
-- attempts to insert into subject_enrollments but is blocked by an INSERT policy.

-- Ensure row level security is enabled (usually enabled already in earlier migrations)
ALTER TABLE IF EXISTS subject_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: allow students to insert their own subject_enrollments
CREATE POLICY IF NOT EXISTS "Students can insert their own subject_enrollments" 
  ON subject_enrollments
  FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Policy: allow students to select their own subject_enrollments
CREATE POLICY IF NOT EXISTS "Students can select their own subject_enrollments"
  ON subject_enrollments
  FOR SELECT
  USING (student_id = auth.uid());

-- Policy: allow students to update their own subject_enrollments
CREATE POLICY IF NOT EXISTS "Students can update their own subject_enrollments"
  ON subject_enrollments
  FOR UPDATE
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

-- Policy: allow students to delete their own subject_enrollments
CREATE POLICY IF NOT EXISTS "Students can delete their own subject_enrollments"
  ON subject_enrollments
  FOR DELETE
  USING (student_id = auth.uid());

-- Admins should still be able to manage everything; add an admin full-access policy if one doesn't exist
CREATE POLICY IF NOT EXISTS "Admins can manage subject_enrollments" 
  ON subject_enrollments
  FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notes:
-- After applying this migration, the trigger that inserts into subject_enrollments
-- (trigger_enroll_student_in_group_subjects) will be able to insert rows when the
-- currently authenticated user matches NEW.student_id (typical case when a student
-- updates their own student_enrollments row).

-- End of migration
