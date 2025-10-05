-- Debug script to diagnose signup issues and create test users
-- Run this in Supabase SQL Editor to check the current state and create test data

-- 1. Check if the handle_new_user function exists
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'handle_new_user';

-- 2. Check if the trigger exists
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created';

-- 3. Check if profiles table exists and its structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check if user_role enum exists
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- 5. Test if we can insert directly into profiles (for debugging)
-- This should fail with RLS if policies are working correctly
-- INSERT INTO profiles (id, email, full_name, role) 
-- VALUES ('123e4567-e89b-12d3-a456-426614174000', 'test@example.com', 'Test User', 'student');

-- 6. Create a simplified trigger function for debugging
CREATE OR REPLACE FUNCTION public.handle_new_user_debug()
RETURNS trigger AS $$
BEGIN
  -- Log the attempt
  RAISE NOTICE 'New user trigger fired for: %', NEW.email;
  
  -- Insert into profiles with error handling
  BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
      CASE 
        WHEN NEW.email LIKE '%admin%' THEN 'admin'::user_role
        WHEN NEW.email LIKE '%teacher%' THEN 'teacher'::user_role
        ELSE 'student'::user_role
      END
    );
    RAISE NOTICE 'Profile created successfully for: %', NEW.email;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating profile: % - %', SQLSTATE, SQLERRM;
    -- Don't re-raise the exception to prevent auth failure
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Replace the trigger with the debug version
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_debug();

-- 8. Temporarily disable RLS on profiles for testing (BE CAREFUL!)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 9. Check current profiles
SELECT * FROM profiles;

-- 10. Check if there are any auth users without profiles
SELECT au.id, au.email, au.created_at, p.id as profile_id
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;