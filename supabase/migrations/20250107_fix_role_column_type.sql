-- Fix the role column type issue that's preventing signups
-- The issue is with the user_role type casting in the default value

-- First, check what the user_role enum contains
DO $$
BEGIN
    RAISE NOTICE 'Checking user_role enum values...';
    FOR i IN SELECT unnest(enum_range(NULL::user_role)) LOOP
        RAISE NOTICE 'Enum value: %', i;
    END LOOP;
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'user_role type does not exist!';
END $$;

-- Remove the problematic default constraint
ALTER TABLE profiles 
    ALTER COLUMN role DROP DEFAULT;

-- Change the role column to a simple text type to avoid enum issues
ALTER TABLE profiles 
    ALTER COLUMN role TYPE text 
    USING role::text;

-- Set a simple string default
ALTER TABLE profiles 
    ALTER COLUMN role SET DEFAULT 'client';

-- Update any existing NULL values
UPDATE profiles 
SET role = 'client' 
WHERE role IS NULL;

-- Make role NOT NULL now that we've cleaned up the data
ALTER TABLE profiles 
    ALTER COLUMN role SET NOT NULL;

-- Add a check constraint to ensure only valid roles
ALTER TABLE profiles 
    ADD CONSTRAINT valid_role CHECK (role IN ('client', 'admin', 'therapist'));

-- Verify the changes
DO $$
DECLARE
    col_info record;
BEGIN
    SELECT column_name, data_type, is_nullable, column_default
    INTO col_info
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
    AND column_name = 'role';
    
    RAISE NOTICE 'Role column after changes:';
    RAISE NOTICE 'Data type: %, Nullable: %, Default: %', 
        col_info.data_type, col_info.is_nullable, col_info.column_default;
END $$;

-- Test that we can insert a profile with the new schema
DO $$
BEGIN
    -- This is just a test, it will rollback
    INSERT INTO profiles (id, email, role) 
    VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com', 'client');
    
    RAISE NOTICE 'Test insert successful!';
    
    -- Rollback the test
    ROLLBACK;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test insert failed: %', SQLERRM;
        ROLLBACK;
END $$;