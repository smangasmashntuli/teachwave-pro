-- Quick check to verify the role fix worked
-- Run this to see if johndoe@admin.school.edu now has admin role

SELECT 
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'johndoe@admin.school.edu';

-- Also check all users to see role distribution
SELECT 
    role,
    COUNT(*) as count,
    string_agg(email, ', ') as users
FROM profiles 
GROUP BY role
ORDER BY role;