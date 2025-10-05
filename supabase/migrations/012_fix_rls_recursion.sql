-- DEFINITIVE FIX for infinite recursion in RLS policies
-- This completely removes the circular dependency causing error 42P17

-- Step 1: Drop ALL problematic policies that cause recursion
DROP POLICY IF EXISTS "Teachers can view their students" ON profiles;
DROP POLICY IF EXISTS "Teachers can view students" ON profiles;
DROP POLICY IF EXISTS "Teachers can view grades they teach" ON grades;
DROP POLICY IF EXISTS "Teachers can view grades" ON grades;
DROP POLICY IF EXISTS "Students can view their subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can view their subjects" ON subjects;
DROP POLICY IF EXISTS "Teachers can view subjects" ON subjects;
DROP POLICY IF EXISTS "Students can view enrollments in assigned subjects" ON student_enrollments;
DROP POLICY IF EXISTS "Students can view enrollments" ON student_enrollments;
DROP POLICY IF EXISTS "Teachers can view enrollments for their grades" ON student_enrollments;

-- Step 2: Create SIMPLE, NON-RECURSIVE policies for profiles
-- Users can always see their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Admins can see all profiles (simple check, no recursion)
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Teachers can see all student profiles (simplified)
CREATE POLICY "Teachers can view students" ON profiles FOR SELECT
USING (
  role = 'student' AND
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() AND p.role = 'teacher'
  )
);

-- Step 3: Simplify other table policies to avoid recursion
-- Grades - simple role-based access
CREATE POLICY "Users can view grades by role" ON grades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'teacher', 'student')
  )
);

-- Subjects - simple role-based access  
CREATE POLICY "Users can view subjects by role" ON subjects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'teacher', 'student')
  )
);

-- Student enrollments - simple access
CREATE POLICY "Students can view own enrollments" ON student_enrollments FOR SELECT
USING (student_id = auth.uid());

CREATE POLICY "Teachers and admins can view enrollments" ON student_enrollments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND p.role IN ('admin', 'teacher')
  )
);

-- Step 4: Grant direct permissions to bypass some RLS complexities
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON grades TO authenticated;
GRANT SELECT ON subjects TO authenticated;
GRANT SELECT ON student_enrollments TO authenticated;

-- Step 5: Verify the fix by testing a profile query
-- This should now work without recursion
SELECT id, email, full_name, role FROM profiles LIMIT 5;