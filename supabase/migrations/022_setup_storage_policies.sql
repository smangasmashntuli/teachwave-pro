-- Setup storage bucket and policies for learning materials
-- This ensures proper access control for uploaded content

-- First, create the storage bucket (this bypasses RLS as it's done at migration level)
INSERT INTO storage.buckets (
  id, 
  name, 
  public, 
  file_size_limit, 
  allowed_mime_types,
  created_at,
  updated_at
) VALUES (
  'learning-materials',
  'learning-materials',
  true,
  10485760, -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'video/mp4',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain'
  ],
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types,
  updated_at = NOW();

-- Policy for teachers to upload files
CREATE POLICY "Teachers can upload learning materials" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'learning-materials' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'teacher'
  )
);

-- Policy for teachers to view their own uploaded files
CREATE POLICY "Teachers can view their learning materials" ON storage.objects
FOR SELECT USING (
  bucket_id = 'learning-materials'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_profiles.id = auth.uid() 
    AND user_profiles.role = 'teacher'
  )
);

-- Policy for students to view learning materials from their enrolled subjects
CREATE POLICY "Students can view learning materials" ON storage.objects
FOR SELECT USING (
  bucket_id = 'learning-materials'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN student_subject_enrollments sse ON up.id = sse.student_id
    JOIN learning_content lc ON lc.subject_id = sse.subject_id
    WHERE up.id = auth.uid()
    AND up.role = 'student'
    AND (storage.foldername(name))[1] = lc.id::text
  )
);

-- Policy for teachers to update/delete their own learning materials
CREATE POLICY "Teachers can manage their learning materials" ON storage.objects
FOR ALL USING (
  bucket_id = 'learning-materials'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_profiles up
    JOIN teacher_assignments ta ON up.id = ta.teacher_id
    JOIN learning_content lc ON lc.subject_id = ta.subject_id
    WHERE up.id = auth.uid()
    AND up.role = 'teacher'
    AND (storage.foldername(name))[1] = lc.id::text
  )
);

-- Create index to improve policy performance
CREATE INDEX IF NOT EXISTS idx_learning_content_subject_id ON learning_content(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_subject ON student_subject_enrollments(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_subject ON teacher_assignments(teacher_id, subject_id);