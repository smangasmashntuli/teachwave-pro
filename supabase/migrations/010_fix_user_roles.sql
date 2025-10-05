-- Fix role assignment for existing users
-- This will correct the role for johndoe@admin.school.edu and any other misassigned users

-- Step 1: Check current user roles
SELECT id, email, full_name, role FROM profiles WHERE email ILIKE '%admin%' OR email ILIKE '%teacher%';

-- Step 2: Update the specific user's role
UPDATE profiles 
SET role = 'admin'::user_role, updated_at = NOW()
WHERE email = 'johndoe@admin.school.edu';

-- Step 3: Fix any other users with admin in their email
UPDATE profiles 
SET role = 'admin'::user_role, updated_at = NOW()
WHERE email ILIKE '%admin%' AND role != 'admin';

-- Step 4: Fix any users with teacher patterns
UPDATE profiles 
SET role = 'teacher'::user_role, updated_at = NOW()
WHERE (email ILIKE '%teacher%' OR email ILIKE '%prof%' OR email ILIKE '%dr.%') 
AND role != 'teacher';

-- Step 5: Verify the changes
SELECT 
    email, 
    full_name, 
    role,
    CASE 
        WHEN email ILIKE '%admin%' THEN 'Should be admin'
        WHEN email ILIKE '%teacher%' OR email ILIKE '%prof%' OR email ILIKE '%dr.%' THEN 'Should be teacher'
        ELSE 'Should be student'
    END as expected_role
FROM profiles 
ORDER BY role, email;

-- Step 6: Create a better trigger function that handles more patterns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user with improved role detection
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      -- More comprehensive admin detection
      WHEN NEW.email ILIKE '%admin%' THEN 'admin'::user_role
      WHEN NEW.email ILIKE '%administrator%' THEN 'admin'::user_role
      WHEN NEW.email ILIKE '%@admin.%' THEN 'admin'::user_role
      WHEN NEW.email ILIKE '%manager%' THEN 'admin'::user_role
      
      -- More comprehensive teacher detection  
      WHEN NEW.email ILIKE '%teacher%' THEN 'teacher'::user_role
      WHEN NEW.email ILIKE '%@teacher.%' THEN 'teacher'::user_role
      WHEN NEW.email ILIKE '%prof%' THEN 'teacher'::user_role
      WHEN NEW.email ILIKE '%professor%' THEN 'teacher'::user_role
      WHEN NEW.email ILIKE '%dr.%' THEN 'teacher'::user_role
      WHEN NEW.email ILIKE '%instructor%' THEN 'teacher'::user_role
      WHEN NEW.email ILIKE '%faculty%' THEN 'teacher'::user_role
      
      -- Default to student
      ELSE 'student'::user_role
    END
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't prevent user creation
    RAISE WARNING 'Could not create profile for user %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$;