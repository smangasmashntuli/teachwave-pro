-- Quick diagnosis and fix for profile loading issues
-- Run this to check if the profile exists and fix RLS temporarily

-- Step 1: Check if the user has a profile
SELECT 
  au.id, 
  au.email, 
  au.created_at as user_created,
  p.id as profile_id,
  p.full_name,
  p.role,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.id = '26a0189d-19eb-44d4-9bfa-b22c5de1af83';

-- Step 2: If no profile exists, create one
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'),
  'admin'::user_role
FROM auth.users au
WHERE au.id = '26a0189d-19eb-44d4-9bfa-b22c5de1af83'
AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = au.id);

-- Step 3: Temporarily disable RLS on profiles to test (CAREFUL!)
-- Uncomment the next line only if testing
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 4: Test profile query as it would be done from the app
SELECT * FROM profiles WHERE id = '26a0189d-19eb-44d4-9bfa-b22c5de1af83';

-- Step 5: Re-enable RLS (uncomment if you disabled it above)
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 6: Check what policies are active on profiles
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 7: Grant necessary permissions for the authenticated role
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;