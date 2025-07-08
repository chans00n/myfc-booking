-- Final working profile policies

-- 1. Drop all existing policies
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON profiles', policy_rec.policyname);
    END LOOP;
END $$;

-- 2. Create working policies

-- All authenticated users can read all profiles
-- This is needed because:
-- - Users need to see their own profile
-- - Admins need to see all profiles for appointments/clients pages
-- - The app needs to check user roles
CREATE POLICY "Authenticated users can read profiles" ON profiles
    FOR SELECT 
    TO authenticated
    USING (true);

-- Users can only UPDATE their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can INSERT their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Only admins can DELETE profiles
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 3. Verify the policies work
SELECT 
    'Policy check' as test,
    COUNT(*) as visible_profiles,
    COUNT(CASE WHEN id = auth.uid() THEN 1 END) as own_profile_visible
FROM profiles;

-- 4. Check your specific profile
SELECT 
    'Your profile' as info,
    id,
    email,
    role,
    first_name,
    last_name
FROM profiles
WHERE id = auth.uid();

-- 5. Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Profile Policies Applied ===';
    RAISE NOTICE '✓ All authenticated users can READ profiles';
    RAISE NOTICE '✓ Users can only UPDATE their own profile';
    RAISE NOTICE '✓ Users can only INSERT their own profile';
    RAISE NOTICE '✓ Only admins can DELETE profiles';
    RAISE NOTICE '';
    RAISE NOTICE 'This setup allows:';
    RAISE NOTICE '- Users to manage their own profiles';
    RAISE NOTICE '- Admins to view all profiles (for appointments, etc)';
    RAISE NOTICE '- The app to check user roles without recursion';
    RAISE NOTICE '';
END $$;