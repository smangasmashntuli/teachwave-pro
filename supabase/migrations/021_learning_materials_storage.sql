-- Create storage bucket for learning materials if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-materials', 'learning-materials', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for learning materials bucket
CREATE POLICY "Teachers can upload learning materials" ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'learning-materials' 
  AND (storage.foldername(name))[1] = 'content'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'teacher'
  )
);

CREATE POLICY "Everyone can view learning materials" ON storage.objects FOR SELECT 
WITH CHECK (bucket_id = 'learning-materials');

CREATE POLICY "Teachers can delete their own materials" ON storage.objects FOR DELETE 
USING (
  bucket_id = 'learning-materials'
  AND (storage.foldername(name))[2] = auth.uid()::text
);