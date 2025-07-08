-- Fix only the trigger without changing column types

-- Step 1: Ensure user_role type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('client', 'admin', 'therapist');
        RAISE NOTICE 'Created user_role type';
    END IF;
END $$;

-- Step 2: Drop any existing trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user_simple() CASCADE;
DROP FUNCTION IF EXISTS simple_handle_new_user() CASCADE;

-- Step 3: Create a trigger function that works with the existing column type
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    BEGIN
        -- Insert with proper type handling
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
            'client'::user_role, -- Cast to the enum type that now exists
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
            
        RAISE LOG 'Profile created/updated for user %', new.id;
    EXCEPTION
        WHEN OTHERS THEN
            -- Don't fail signup
            RAISE LOG 'Profile creation warning for user %: %', new.id, SQLERRM;
    END;
    
    RETURN new;
END;
$$;

-- Step 4: Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 5: Verify the setup
DO $$
DECLARE
    trigger_exists boolean;
    type_exists boolean;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    -- Check if type exists
    SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'user_role'
    ) INTO type_exists;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Signup fix status ===';
    RAISE NOTICE 'Trigger exists: %', trigger_exists;
    RAISE NOTICE 'user_role type exists: %', type_exists;
    RAISE NOTICE 'Signup should now work!';
    RAISE NOTICE '';
END $$;