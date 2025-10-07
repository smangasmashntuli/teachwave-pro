-- Migration: Add student_enrollments table for grade and subject group selection
-- This table tracks which grade and subject group each student is enrolled in

-- Create student_enrollments table
CREATE TABLE IF NOT EXISTS student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grade_id UUID NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  subject_group_id UUID NOT NULL REFERENCES subject_groups(id) ON DELETE CASCADE,
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Ensure one active enrollment per student
  UNIQUE(student_id) WHERE is_active = TRUE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_grade_id ON student_enrollments(grade_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_subject_group_id ON student_enrollments(subject_group_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_active ON student_enrollments(is_active) WHERE is_active = TRUE;

-- Enable RLS (Row Level Security)
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Students can only see and modify their own enrollment
CREATE POLICY "Students can view their own enrollment" 
  ON student_enrollments FOR SELECT 
  USING (auth.uid() = student_id);

CREATE POLICY "Students can insert their own enrollment" 
  ON student_enrollments FOR INSERT 
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own enrollment" 
  ON student_enrollments FOR UPDATE 
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" 
  ON student_enrollments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Teachers can view enrollments for their subject groups
CREATE POLICY "Teachers can view relevant enrollments" 
  ON student_enrollments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM teacher_assignments ta
      JOIN subject_group_assignments sga ON ta.subject_id = sga.subject_id
      WHERE ta.teacher_id = auth.uid() 
      AND sga.subject_group_id = student_enrollments.subject_group_id
    )
  );

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_student_enrollments_updated_at 
  BEFORE UPDATE ON student_enrollments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE student_enrollments IS 'Tracks student enrollment in grades and subject groups';
COMMENT ON COLUMN student_enrollments.student_id IS 'Reference to the student user';
COMMENT ON COLUMN student_enrollments.grade_id IS 'The grade the student is enrolled in';
COMMENT ON COLUMN student_enrollments.subject_group_id IS 'The subject group/combination the student selected';
COMMENT ON COLUMN student_enrollments.enrollment_date IS 'When the student made this selection';
COMMENT ON COLUMN student_enrollments.is_active IS 'Whether this enrollment is currently active';