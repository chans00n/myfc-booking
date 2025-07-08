-- Diagnostic queries to understand the signup issue
-- Run these queries in your Supabase SQL editor to diagnose the problem

-- 1. Check what triggers exist on auth.users table
SELECT 
    tgname AS trigger_name,
    tgtype,
    proname AS function_name,
    tgenabled AS is_enabled
FROM pg_trigger 
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- 2. Check the current function definition if it exists
SELECT 
    proname AS function_name,
    prosrc AS function_source
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Check all policies on the profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Check if there are any failed user creation attempts in auth.users
SELECT 
    COUNT(*) as total_users,
    COUNT(DISTINCT email) as unique_emails,
    MAX(created_at) as last_user_created
FROM auth.users;

-- 5. Check if profiles table has any constraints that might be failing
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- 6. Check the structure of the profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 7. Test if we can manually insert into profiles (this will fail, just for diagnostic)
-- DO NOT RUN THIS IN PRODUCTION
/*
INSERT INTO profiles (id, email, role) 
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'client')
ON CONFLICT (id) DO NOTHING;
*/

-- 8. Check recent error logs if available
-- This might not work depending on your Supabase plan
/*
SELECT * FROM pg_stat_activity 
WHERE state = 'idle in transaction' 
   OR state = 'idle in transaction (aborted)';
*/