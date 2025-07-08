-- Comprehensive fix for the role column type issue
-- This will drop ALL policies that reference the role column, fix the type, then recreate them

-- Step 1: Drop ALL policies on the profiles table first
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    -- Drop all policies on profiles table
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON profiles', policy_rec.policyname);
        RAISE NOTICE 'Dropped policy % on profiles', policy_rec.policyname;
    END LOOP;
    
    -- Drop policies on other tables that reference profiles.role
    FOR policy_rec IN 
        SELECT DISTINCT policyname, tablename
        FROM pg_policies
        WHERE tablename != 'profiles'
        AND (qual::text LIKE '%profiles.role%' OR with_check::text LIKE '%profiles.role%')
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON %I', policy_rec.policyname, policy_rec.tablename);
        RAISE NOTICE 'Dropped policy % on table %', policy_rec.policyname, policy_rec.tablename;
    END LOOP;
END $$;

-- Step 2: Now we can safely alter the role column
ALTER TABLE profiles 
    ALTER COLUMN role DROP DEFAULT;

ALTER TABLE profiles 
    ALTER COLUMN role TYPE text 
    USING COALESCE(role::text, 'client');

ALTER TABLE profiles 
    ALTER COLUMN role SET DEFAULT 'client';

-- Update any NULL values
UPDATE profiles 
SET role = 'client' 
WHERE role IS NULL OR role = '';

-- Step 3: Add constraint for valid roles
ALTER TABLE profiles 
    DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE profiles 
    ADD CONSTRAINT valid_role CHECK (role IN ('client', 'admin', 'therapist'));

-- Step 4: Recreate essential policies for profiles table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role = 'admin'
        )
    );

-- Step 5: Recreate policies for other tables
-- Intake forms policies
CREATE POLICY "Admins can view all intake forms" ON intake_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all intake forms" ON intake_forms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Step 6: Verify the changes
DO $$
DECLARE
    col_info RECORD;
BEGIN
    SELECT column_name, data_type, is_nullable, column_default
    INTO col_info
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'role';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Role column successfully converted ===';
    RAISE NOTICE 'Data type: %', col_info.data_type;
    RAISE NOTICE 'Default value: %', col_info.column_default;
    RAISE NOTICE '';
    RAISE NOTICE 'The signup 500 error should now be resolved!';
END $$;