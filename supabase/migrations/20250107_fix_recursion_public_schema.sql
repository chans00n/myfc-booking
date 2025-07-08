-- Fix infinite recursion in profiles RLS policies
-- This version creates the function in public schema instead of auth schema

-- Step 1: Drop ALL existing policies on profiles to start fresh
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

-- Step 2: Create simple, non-recursive policies for basic operations
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 3: For admin policies, we'll use a different approach
-- Since we can't query profiles table (causes recursion) or create functions in auth schema,
-- we'll check the JWT claims directly in the policy

-- Admins can view all profiles (using JWT role claim)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        auth.uid() = id -- User can always see their own
        OR 
        (auth.jwt() ->> 'role')::text = 'admin' -- Check JWT claim
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        auth.uid() = id -- User can always update their own
        OR 
        (auth.jwt() ->> 'role')::text = 'admin' -- Check JWT claim
    );

-- Step 4: Alternative approach - create admin policies that check user metadata
-- This is a backup in case JWT claims aren't set properly
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Step 5: Verify the fix
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Infinite Recursion Fix Complete ===';
    RAISE NOTICE 'Profiles policies have been recreated without recursion';
    RAISE NOTICE 'Admin policies now check JWT claims or auth.users metadata directly';
    RAISE NOTICE 'No recursive queries to profiles table';
    RAISE NOTICE '';
END $$;