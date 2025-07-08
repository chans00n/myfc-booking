-- Force fix profile access issues

-- 1. First check what auth.uid() returns
SELECT 
    'Current auth.uid():' as info,
    auth.uid() as user_id;

-- 2. Check if this user exists in profiles
SELECT 
    'Profile exists for this user?' as info,
    EXISTS(
        SELECT 1 FROM profiles WHERE id = auth.uid()
    ) as exists;

-- 3. Drop ALL policies on profiles table
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    RAISE NOTICE 'Dropping all policies on profiles table...';
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles'
    LOOP
        EXECUTE format('DROP POLICY "%s" ON profiles', policy_rec.policyname);
        RAISE NOTICE 'Dropped: %', policy_rec.policyname;
    END LOOP;
END $$;

-- 4. Create the most basic possible policy
CREATE POLICY "Everyone can read all profiles" ON profiles
    FOR SELECT USING (true);

-- 5. Test if you can see profiles now
SELECT 
    'Can see profiles now?' as test,
    COUNT(*) as visible_profiles
FROM profiles;

-- 6. Test if you can see YOUR profile
SELECT 
    'Your profile:' as info,
    id,
    email,
    role
FROM profiles
WHERE id = auth.uid();

-- 7. Now create proper policies
DROP POLICY "Everyone can read all profiles" ON profiles;

-- Basic user policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin policies (separate from user policies to avoid conflicts)
CREATE POLICY "Admins can select all profiles" ON profiles
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
    );

-- 8. Final test
SELECT 
    'Final test - can you see your profile?' as test,
    CASE 
        WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid())
        THEN 'YES - Profile visible'
        ELSE 'NO - Still cannot see profile'
    END as result;

-- 9. If still not working, check RLS status
SELECT 
    'RLS enabled on profiles?' as info,
    relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'profiles';

-- 10. Nuclear option - disable RLS entirely (ONLY FOR TESTING!)
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- 
-- If you uncomment the above line and it fixes the issue, 
-- then we know RLS policies are the problem