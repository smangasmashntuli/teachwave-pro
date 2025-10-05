-- Test script to create a profile for the user that was hanging
-- Run this to ensure the user 26a0189d-19eb-44d4-9bfa-b22c5de1af83 has a profile

-- First check if the user exists in auth.users
SELECT id, email, created_at FROM auth.users WHERE id = '26a0189d-19eb-44d4-9bfa-b22c5de1af83';

-- Temporarily disable RLS to ensure we can create/read profiles
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Create or update the profile for this user
INSERT INTO profiles (id, email, full_name, role, avatar_url, phone, date_of_birth, created_at, updated_at)
SELECT 
    '26a0189d-19eb-44d4-9bfa-b22c5de1af83',
    COALESCE(au.email, 'admin@example.com'),
    COALESCE(au.raw_user_meta_data->>'full_name', 'Admin User'),
    'admin'::user_role,
    NULL,
    NULL, 
    NULL,
    NOW(),
    NOW()
FROM auth.users au WHERE au.id = '26a0189d-19eb-44d4-9bfa-b22c5de1af83'
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();

-- Verify the profile was created
SELECT * FROM profiles WHERE id = '26a0189d-19eb-44d4-9bfa-b22c5de1af83';

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Test if the profile can be read with RLS enabled (this might fail due to policies)
SELECT id, email, full_name, role FROM profiles WHERE id = '26a0189d-19eb-44d4-9bfa-b22c5de1af83';