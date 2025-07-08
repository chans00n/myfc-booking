-- Comprehensive fix for all profile policies

-- 1. Check what policies currently exist on profiles
SELECT 
    policyname,
    cmd,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Drop ALL existing policies to start fresh
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON profiles', policy_rec.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_rec.policyname;
    END LOOP;
END $$;

-- 3. Create all necessary policies for profiles

-- Users can view their own profile (CRITICAL - this was missing!)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Admins can view ALL profiles (needed for appointments, clients pages, etc.)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() = id  -- Can always see own profile
        OR
        EXISTS (         -- OR is an admin
            SELECT 1 FROM profiles admin_check
            WHERE admin_check.id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check
            WHERE admin_check.id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles admin_check
            WHERE admin_check.id = auth.uid()
            AND admin_check.role = 'admin'
        )
    );

-- 4. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. Test the policies
DO $$
DECLARE
    own_profile_visible BOOLEAN;
    total_profiles_visible INTEGER;
    current_user_id UUID;
    current_role TEXT;
BEGIN
    current_user_id := auth.uid();
    
    -- Check if user can see their own profile
    SELECT EXISTS(
        SELECT 1 FROM profiles WHERE id = current_user_id
    ) INTO own_profile_visible;
    
    -- Get user role
    SELECT role INTO current_role
    FROM profiles
    WHERE id = current_user_id;
    
    -- Count total visible profiles
    SELECT COUNT(*) INTO total_profiles_visible FROM profiles;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Profile Policies Test ===';
    RAISE NOTICE 'Current user ID: %', current_user_id;
    RAISE NOTICE 'Current user role: %', current_role;
    RAISE NOTICE 'Can see own profile: %', own_profile_visible;
    RAISE NOTICE 'Total profiles visible: %', total_profiles_visible;
    
    IF NOT own_profile_visible THEN
        RAISE WARNING 'CRITICAL: User cannot see their own profile!';
    END IF;
    
    IF current_role = 'admin' THEN
        RAISE NOTICE 'As admin, you should see all profiles.';
    ELSE
        RAISE NOTICE 'As non-admin, you should only see your own profile.';
    END IF;
    RAISE NOTICE '';
END $$;