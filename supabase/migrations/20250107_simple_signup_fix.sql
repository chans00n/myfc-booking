-- Simple fix for the signup issue - focus on removing user_role references

-- Step 1: Ensure user_role type exists (in case something still needs it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'admin', 'therapist');
        RAISE NOTICE 'Created user_role type';
    END IF;
END $$;

-- Step 2: Drop any existing trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Step 3: Create a minimal trigger function with NO type casting
CREATE OR REPLACE FUNCTION handle_new_user_simple()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    BEGIN
        INSERT INTO public.profiles (
            id,
            email,
            first_name,
            last_name,
            phone,
            role,
            created_at,
            updated_at
        )
        VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'first_name', ''),
            COALESCE(new.raw_user_meta_data->>'last_name', ''),
            new.raw_user_meta_data->>'phone',
            'client', -- Hard-coded string, no casting
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET
            email = EXCLUDED.email,
            first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
            last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
            phone = COALESCE(EXCLUDED.phone, profiles.phone),
            updated_at = NOW();
    EXCEPTION
        WHEN OTHERS THEN
            -- Don't fail signup, just log
            RAISE LOG 'Profile creation issue: %', SQLERRM;
    END;
    
    RETURN new;
END;
$$;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_simple();

-- Step 5: Ensure profiles table has simple text column for role
ALTER TABLE profiles 
    ALTER COLUMN role TYPE text;

-- Step 6: Set a simple default without casting
ALTER TABLE profiles 
    ALTER COLUMN role SET DEFAULT 'client';

-- Step 7: Test message
DO $$
BEGIN
    RAISE NOTICE 'Signup fix applied - triggers recreated without type casting';
END $$;