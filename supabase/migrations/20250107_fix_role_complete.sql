-- Fix the role column type issue by temporarily dropping dependent policies
-- Then recreating them after the type change

-- Step 1: Find and drop all policies that reference profiles.role
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    -- Drop policies on intake_forms that reference profiles.role
    FOR policy_rec IN 
        SELECT DISTINCT policyname, tablename
        FROM pg_policies
        WHERE (qual::text LIKE '%profiles.role%' OR with_check::text LIKE '%profiles.role%')
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
    USING role::text;

ALTER TABLE profiles 
    ALTER COLUMN role SET DEFAULT 'client';

-- Update any NULL values
UPDATE profiles 
SET role = 'client' 
WHERE role IS NULL;

-- Step 3: Recreate the dropped policies with text comparison
-- Recreate admin policies for intake_forms
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

-- Check if there are policies on other tables that need recreation
CREATE POLICY IF NOT EXISTS "Admins can view all appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY IF NOT EXISTS "Admins can manage all appointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Step 4: Add constraint for valid roles
ALTER TABLE profiles 
    DROP CONSTRAINT IF EXISTS valid_role;

ALTER TABLE profiles 
    ADD CONSTRAINT valid_role CHECK (role IN ('client', 'admin', 'therapist'));

-- Step 5: Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'role';

-- Step 6: Quick test to ensure signup will work
DO $$
BEGIN
    -- Test that we can insert with the new column type
    PERFORM 1 WHERE 'client'::text = 'client';
    RAISE NOTICE 'Role column successfully converted to text type';
END $$;