-- Create learning materials storage bucket manually
-- This script should be run as a database migration or with admin privileges

BEGIN;

-- Insert the bucket directly into the storage.buckets table
-- This bypasses RLS policies since it's run at the database level
INSERT INTO storage.buckets (
    id,
    name, 
    owner,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at,
    updated_at
) VALUES (
    'learning-materials',
    'learning-materials',
    NULL,
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

-- Grant necessary permissions for the bucket
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Teachers can upload learning materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can view their learning materials" ON storage.objects;
DROP POLICY IF EXISTS "Students can view learning materials" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can manage their learning materials" ON storage.objects;

-- Allow teachers to upload files
CREATE POLICY "Teachers can upload learning materials" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'learning-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'teacher'
    )
);

-- Allow teachers to view their own files  
CREATE POLICY "Teachers can view their learning materials" ON storage.objects
FOR SELECT USING (
    bucket_id = 'learning-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'teacher'
    )
);

-- Allow students to view learning materials (public access)
CREATE POLICY "Students can view learning materials" ON storage.objects
FOR SELECT USING (
    bucket_id = 'learning-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'student'
    )
);

-- Allow teachers to update/delete their files
CREATE POLICY "Teachers can manage their learning materials" ON storage.objects
FOR ALL USING (
    bucket_id = 'learning-materials'
    AND auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'teacher'
    )
);

COMMIT;

-- Verify the bucket was created
SELECT 
    id,
    name,
    public,
    file_size_limit,
    array_length(allowed_mime_types, 1) as mime_types_count,
    created_at
FROM storage.buckets 
WHERE id = 'learning-materials';