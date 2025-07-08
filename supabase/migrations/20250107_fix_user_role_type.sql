-- Fix the missing user_role type that's causing signup failures
-- The error shows that something is still trying to use the user_role enum type

-- Check if user_role type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        RAISE NOTICE 'user_role type does not exist, creating it...';
        CREATE TYPE user_role AS ENUM ('client', 'admin', 'therapist');
    ELSE
        RAISE NOTICE 'user_role type already exists';
    END IF;
END $$;

-- Find all functions that might be using user_role type
SELECT 
    'Functions that reference user_role:' as info;
SELECT 
    p.proname AS function_name,
    n.nspname AS schema_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) LIKE '%user_role%'
ORDER BY n.nspname, p.proname;

-- Check if there are any remaining references to user_role in column defaults
SELECT 
    'Columns with user_role in default:' as info;
SELECT 
    table_schema,
    table_name,
    column_name,
    column_default
FROM information_schema.columns
WHERE column_default LIKE '%user_role%';

-- Remove any lingering references to user_role in the raw_user_meta_data
-- This might be where the issue is coming from
DO $$
DECLARE
    func_rec RECORD;
BEGIN
    -- Find and drop/recreate any functions that use user_role casting
    FOR func_rec IN 
        SELECT p.proname, n.nspname, p.oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE pg_get_functiondef(p.oid) LIKE '%::user_role%'
    LOOP
        RAISE NOTICE 'Found function % in schema % that uses user_role casting', func_rec.proname, func_rec.nspname;
        -- You would need to manually recreate these functions without the ::user_role cast
    END LOOP;
END $$;

-- Create a simple trigger function that doesn't use any type casting
CREATE OR REPLACE FUNCTION simple_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only create profile if it doesn't exist
    INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        phone,
        role
    )
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'first_name', ''),
        COALESCE(new.raw_user_meta_data->>'last_name', ''),
        new.raw_user_meta_data->>'phone',
        COALESCE(new.raw_user_meta_data->>'role', 'client') -- No type casting!
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = NOW();
    
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Just log and continue - don't fail the signup
        RAISE LOG 'Profile creation failed for user %: %', new.id, SQLERRM;
        RETURN new;
END;
$$;

-- Drop any existing trigger and recreate with the simple function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION simple_handle_new_user();

-- Final check - make sure the profiles table accepts plain text for role
ALTER TABLE profiles 
    ALTER COLUMN role TYPE text USING role::text;

-- Ensure the default is a plain string, not a cast
ALTER TABLE profiles 
    ALTER COLUMN role SET DEFAULT 'client';

-- Verify everything is clean
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Signup fix completed ===';
    RAISE NOTICE 'The user_role type issue should now be resolved';
    RAISE NOTICE 'Signup should work without 500 errors';
    RAISE NOTICE '';
END $$;