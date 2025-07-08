-- Debug profile access issues

-- 1. Check if the current user exists and can access their own profile
DO $$
DECLARE
    current_user_id UUID;
    profile_exists BOOLEAN;
    can_select_profile BOOLEAN;
    profile_data RECORD;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'ERROR: No authenticated user found (auth.uid() is NULL)';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Current user ID: %', current_user_id;
    
    -- Check if profile exists (bypassing RLS)
    SET LOCAL row_security TO OFF;
    SELECT EXISTS(
        SELECT 1 FROM profiles WHERE id = current_user_id
    ) INTO profile_exists;
    SET LOCAL row_security TO ON;
    
    RAISE NOTICE 'Profile exists in database: %', profile_exists;
    
    -- Check if user can SELECT their profile with RLS
    BEGIN
        SELECT * INTO profile_data
        FROM profiles 
        WHERE id = current_user_id;
        
        can_select_profile := FOUND;
        
        IF FOUND THEN
            RAISE NOTICE 'Can SELECT own profile: YES';
            RAISE NOTICE 'Profile data: ID=%, Email=%, Role=%', 
                profile_data.id, profile_data.email, profile_data.role;
        ELSE
            RAISE NOTICE 'Can SELECT own profile: NO';
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Error selecting profile: %', SQLERRM;
            can_select_profile := FALSE;
    END;
    
    -- If profile doesn't exist, create it
    IF NOT profile_exists THEN
        RAISE NOTICE 'Creating missing profile...';
        
        -- Get user email from auth.users
        INSERT INTO profiles (id, email, role, created_at, updated_at)
        SELECT 
            id, 
            email, 
            'client',
            NOW(),
            NOW()
        FROM auth.users
        WHERE id = current_user_id
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Profile created';
    END IF;
    
    -- List all policies on profiles table
    RAISE NOTICE '';
    RAISE NOTICE 'Current policies on profiles table:';
    FOR profile_data IN 
        SELECT policyname, cmd, qual::text as policy_condition
        FROM pg_policies
        WHERE tablename = 'profiles'
        ORDER BY policyname
    LOOP
        RAISE NOTICE '  - % (%): %', 
            profile_data.policyname, 
            profile_data.cmd, 
            LEFT(profile_data.policy_condition, 60);
    END LOOP;
END $$;

-- 2. Try a simple fix - create a very basic SELECT policy
DROP POLICY IF EXISTS "Anyone can view own profile" ON profiles;
CREATE POLICY "Anyone can view own profile" ON profiles
    FOR SELECT 
    USING (auth.uid() = id);

-- 3. Test again
SELECT 
    'After fix - can you see your profile?' as test,
    CASE 
        WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid())
        THEN 'YES'
        ELSE 'NO'
    END as result;

-- 4. If you're still having issues, try this nuclear option
-- This temporarily allows EVERYONE to read ALL profiles (for debugging only!)
-- DROP POLICY IF EXISTS "TEMPORARY - Everyone can read profiles" ON profiles;
-- CREATE POLICY "TEMPORARY - Everyone can read profiles" ON profiles
--     FOR SELECT USING (true);
-- 
-- WARNING: Only uncomment the above if nothing else works, and remove it after debugging!