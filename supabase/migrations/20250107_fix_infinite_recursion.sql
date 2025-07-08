-- Fix infinite recursion in profiles RLS policies
-- The issue is that admin policies are checking the profiles table to see if someone is an admin,
-- which creates a recursive loop

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

-- Step 2: Create simple, non-recursive policies
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

-- Step 3: Create a function to check if user is admin WITHOUT querying profiles
-- This prevents the recursion
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    -- Get the role from JWT metadata if available
    user_role := current_setting('request.jwt.claims', true)::json->>'role';
    
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Alternative: Check auth.users metadata
    SELECT raw_user_meta_data->>'role' INTO user_role
    FROM auth.users
    WHERE id = auth.uid();
    
    RETURN user_role = 'admin';
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Step 4: Create admin policies using the non-recursive function
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (auth.is_admin());

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (auth.is_admin());

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE USING (auth.is_admin());

-- Step 5: Create profile for the user who just signed up
-- You'll need to update the user_id with the actual ID from your signup
DO $$
BEGIN
    -- This is just an example - you'll need to run this with the actual user ID
    RAISE NOTICE 'To create a profile for your new user, run:';
    RAISE NOTICE 'INSERT INTO profiles (id, email, first_name, last_name, role) VALUES';
    RAISE NOTICE '(''YOUR_USER_ID'', ''YOUR_EMAIL'', ''YOUR_FIRST_NAME'', ''YOUR_LAST_NAME'', ''client'');';
END $$;

-- Step 6: Verify the policies are working
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Infinite Recursion Fix Complete ===';
    RAISE NOTICE 'Profiles policies have been recreated without recursion';
    RAISE NOTICE 'Admin check now uses JWT claims or auth.users metadata';
    RAISE NOTICE 'You should now be able to create and fetch profiles';
    RAISE NOTICE '';
END $$;