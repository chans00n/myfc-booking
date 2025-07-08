-- Remove ALL triggers and let the application handle profile creation
-- This avoids the user_role type issue entirely

-- Step 1: Drop ALL triggers on auth.users
DO $$
DECLARE
    trigger_rec RECORD;
BEGIN
    FOR trigger_rec IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass 
        AND NOT tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_rec.tgname);
        RAISE NOTICE 'Dropped trigger: %', trigger_rec.tgname;
    END LOOP;
END $$;

-- Step 2: Drop all related functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_simple() CASCADE;
DROP FUNCTION IF EXISTS simple_handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_user(uuid) CASCADE;
DROP FUNCTION IF EXISTS manually_create_profile(uuid, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS ensure_profile_exists() CASCADE;

-- Step 3: Ensure the user_role type exists (just in case something internal needs it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'admin', 'therapist');
        RAISE NOTICE 'Created user_role type';
    END IF;
END $$;

-- Step 4: Make sure profiles table can accept users without issues
-- Ensure role column has a simple default
ALTER TABLE profiles 
    ALTER COLUMN role SET DEFAULT 'client';

-- Make sure all columns allow NULL or have defaults
ALTER TABLE profiles 
    ALTER COLUMN first_name SET DEFAULT '',
    ALTER COLUMN last_name SET DEFAULT '',
    ALTER COLUMN created_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET DEFAULT NOW();

-- Step 5: Clean up any existing test data
DELETE FROM profiles WHERE email = 'test@example.com';

-- Step 6: Verify no triggers remain
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) 
    INTO trigger_count
    FROM pg_trigger 
    WHERE tgrelid = 'auth.users'::regclass 
    AND NOT tgisinternal;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Trigger Removal Complete ===';
    RAISE NOTICE 'Triggers on auth.users: %', trigger_count;
    RAISE NOTICE 'Profile creation will now be handled by the application code';
    RAISE NOTICE 'This avoids the user_role type casting issue entirely';
    RAISE NOTICE '';
END $$;