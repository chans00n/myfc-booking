-- Test by temporarily disabling RLS to isolate the issue

-- 1. Check current auth context
SELECT 
    'Auth check' as test,
    auth.uid() as user_id,
    auth.role() as role,
    current_user as db_user;

-- 2. Count profiles with RLS enabled
SELECT 
    'Profiles visible with RLS' as test,
    COUNT(*) as count
FROM profiles;

-- 3. Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. Count profiles with RLS disabled  
SELECT 
    'Profiles visible WITHOUT RLS' as test,
    COUNT(*) as count
FROM profiles;

-- 5. Try to find your profile
SELECT 
    'Your profile data' as info,
    id,
    email,
    role,
    created_at
FROM profiles
WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
LIMIT 1;

-- 6. Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create a super simple policy that should always work
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
CREATE POLICY "Authenticated users can read profiles" ON profiles
    FOR SELECT 
    TO authenticated
    USING (true);

-- 8. Test with the new policy
SELECT 
    'Can see profiles with new policy?' as test,
    COUNT(*) as count
FROM profiles;

-- 9. Final diagnostic
DO $$
DECLARE
    auth_id UUID;
    auth_role TEXT;
BEGIN
    auth_id := auth.uid();
    auth_role := auth.role();
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Authentication Diagnostic ===';
    RAISE NOTICE 'auth.uid(): %', COALESCE(auth_id::text, 'NULL');
    RAISE NOTICE 'auth.role(): %', COALESCE(auth_role, 'NULL');
    RAISE NOTICE 'current_user: %', current_user;
    
    IF auth_id IS NULL THEN
        RAISE NOTICE 'WARNING: No authenticated user detected!';
        RAISE NOTICE 'This suggests the SQL is running without auth context.';
        RAISE NOTICE 'The app may need to pass auth headers properly.';
    END IF;
    RAISE NOTICE '';
END $$;