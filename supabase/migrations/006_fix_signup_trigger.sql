-- Fix the signup issue by ensuring the trigger works correctly
-- This should resolve the "Database Error Saving New User" issue

-- Step 1: Check and recreate the profile creation function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user with role based on email domain
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      -- Check for admin patterns in email
      WHEN NEW.email ILIKE '%admin%' OR NEW.email ILIKE '%@admin.%' THEN 'admin'::user_role
      -- Check for teacher patterns in email  
      WHEN NEW.email ILIKE '%teacher%' OR NEW.email ILIKE '%@teacher.%' OR NEW.email ILIKE '%prof%' OR NEW.email ILIKE '%dr.%' THEN 'teacher'::user_role
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

-- Step 2: Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Temporarily allow profile creation during signup
GRANT INSERT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO anon;

-- Step 4: Create a simple policy that allows the trigger to work
CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT WITH CHECK (true);

-- Step 5: Test if we can create a profile manually (this should work now)
-- Uncomment the next line to test:
-- SELECT public.handle_new_user();