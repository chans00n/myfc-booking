-- Check the current state of auth and profiles to diagnose the 500 error

-- 1. Check if there are any remaining triggers on auth.users
SELECT 
    'Triggers on auth.users:' as info;
SELECT 
    tgname AS trigger_name,
    tgenabled AS is_enabled,
    proname AS function_name
FROM pg_trigger 
JOIN pg_proc ON pg_proc.oid = pg_trigger.tgfoid
WHERE tgrelid = 'auth.users'::regclass
AND NOT tgisinternal;

-- 2. Check current policies on profiles
SELECT 
    '---' as separator,
    'Current policies on profiles:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check if we can manually create a test user in auth schema
-- This tests if the issue is with Supabase Auth itself
SELECT 
    '---' as separator,
    'Testing basic auth functionality:' as info;

-- 4. Check for any functions that might be interfering
SELECT 
    '---' as separator,
    'Functions that might affect user creation:' as info;
SELECT 
    proname AS function_name,
    pronamespace::regnamespace AS schema
FROM pg_proc
WHERE prosrc LIKE '%auth.users%'
OR prosrc LIKE '%profiles%'
ORDER BY proname;

-- 5. Check the actual error by looking at recent failed transactions
SELECT 
    '---' as separator,
    'Checking for any check constraints that might be failing:' as info;
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN ('public.profiles'::regclass, 'auth.users'::regclass)
AND contype = 'c';

-- 6. Test if we can insert directly into profiles
SELECT 
    '---' as separator,
    'Testing direct insert capability:' as info;
DO $$
BEGIN
    -- Try to insert a test profile
    INSERT INTO profiles (id, email, role) 
    VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'test@example.com', 'client')
    ON CONFLICT (id) DO NOTHING;
    
    -- Check if it worked
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid) THEN
        RAISE NOTICE 'Direct insert to profiles table works!';
        -- Clean up
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
    ELSE
        RAISE NOTICE 'Direct insert to profiles table failed';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during test insert: %', SQLERRM;
END $$;

-- 7. Check Supabase configuration hints
SELECT 
    '---' as separator,
    'Important: Also check these in your Supabase Dashboard:' as info;
SELECT 
    '1. Authentication > Providers > Email - Ensure email signup is enabled' as checklist
UNION ALL
SELECT '2. Authentication > Email Templates - Check if custom templates have errors'
UNION ALL
SELECT '3. Authentication > URL Configuration - Verify redirect URLs are correct'
UNION ALL
SELECT '4. Settings > API - Check if rate limits are being hit'
UNION ALL
SELECT '5. Logs > Recent errors - Look for auth-related errors';