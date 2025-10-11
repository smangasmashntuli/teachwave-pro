-- Fix learning_content RLS policies to allow teachers to insert content
DROP POLICY IF EXISTS "Teachers can manage their content" ON learning_content;

-- Create separate policies for different operations
CREATE POLICY "Teachers can insert content" ON learning_content FOR INSERT 
WITH CHECK (
  teacher_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'teacher'
  )
);

CREATE POLICY "Teachers can view their content" ON learning_content FOR SELECT
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their content" ON learning_content FOR UPDATE
USING (teacher_id = auth.uid())
WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their content" ON learning_content FOR DELETE
USING (teacher_id = auth.uid());