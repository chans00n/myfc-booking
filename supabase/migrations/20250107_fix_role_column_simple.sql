-- Fix the role column type issue that's preventing signups
-- Simplified version without the problematic loop

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

-- Drop any existing constraint
ALTER TABLE profiles 
    DROP CONSTRAINT IF EXISTS valid_role;

-- Add a check constraint to ensure only valid roles
ALTER TABLE profiles 
    ADD CONSTRAINT valid_role CHECK (role IN ('client', 'admin', 'therapist'));

-- Verify the fix by checking the column info
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name = 'role';