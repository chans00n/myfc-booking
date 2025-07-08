-- Reset auth system to a known working state
-- This completely removes all custom triggers and policies that might be interfering

-- Step 1: Remove ALL triggers on auth.users
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'auth.users'::regclass
        AND NOT tgisinternal
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_record.tgname);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.tgname;
    END LOOP;
END $$;

-- Step 2: Drop the handle_new_user function and any variants
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_user(uuid) CASCADE;

-- Step 3: Reset profiles table policies to absolute minimum
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove ALL existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_record.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 4: Create only the most basic policies needed
CREATE POLICY "Enable all operations for authenticated users on own profile" 
ON profiles 
FOR ALL 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 5: Ensure auth configuration allows signup
-- This checks if email confirmations are required
DO $$
BEGIN
    RAISE NOTICE 'Check your Supabase Dashboard:';
    RAISE NOTICE '1. Go to Authentication > Providers > Email';
    RAISE NOTICE '2. Ensure "Enable Email Signup" is ON';
    RAISE NOTICE '3. Consider turning OFF "Confirm email" temporarily for testing';
    RAISE NOTICE '4. Check if there are any email rate limits being hit';
END $$;

-- Step 6: Create a simple manual function to create profiles
-- This can be called manually if needed
CREATE OR REPLACE FUNCTION manually_create_profile(
    user_id UUID,
    user_email TEXT,
    user_first_name TEXT DEFAULT '',
    user_last_name TEXT DEFAULT '',
    user_phone TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO profiles (
        id, 
        email, 
        first_name, 
        last_name, 
        phone, 
        role,
        created_at,
        updated_at
    ) VALUES (
        user_id,
        user_email,
        user_first_name,
        user_last_name,
        user_phone,
        'client',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = NOW();
END;
$$;

-- Step 7: Check and create profiles for any orphaned users
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
    id, 
    email, 
    'client',
    created_at,
    NOW()
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;

-- Final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== AUTH SYSTEM RESET COMPLETE ===';
    RAISE NOTICE 'The system is now in a minimal working state.';
    RAISE NOTICE 'Profile creation will be handled by the application code.';
    RAISE NOTICE '';
    RAISE NOTICE 'If signup still fails after this:';
    RAISE NOTICE '1. Check Supabase Dashboard > Authentication settings';
    RAISE NOTICE '2. Check API rate limits';
    RAISE NOTICE '3. Try creating a user directly in Supabase Dashboard';
    RAISE NOTICE '4. Check Supabase service status';
END $$;