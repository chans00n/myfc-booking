-- Create profile for the user who just signed up
-- Run this after getting the user ID from Supabase Dashboard

-- First, check which users don't have profiles
SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    u.raw_user_meta_data->>'first_name' as first_name,
    u.raw_user_meta_data->>'last_name' as last_name,
    u.raw_user_meta_data->>'phone' as phone,
    CASE WHEN p.id IS NULL THEN 'NO PROFILE' ELSE 'HAS PROFILE' END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- Create profiles for ALL users that don't have one
INSERT INTO profiles (id, email, first_name, last_name, phone, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'first_name', ''),
    COALESCE(u.raw_user_meta_data->>'last_name', ''),
    u.raw_user_meta_data->>'phone',
    'client'
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Verify the profiles were created
SELECT COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;