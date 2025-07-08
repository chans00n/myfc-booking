-- Fix signup issue by ensuring the trigger function can bypass RLS
-- The issue is that the trigger runs in the context of the new user being created,
-- but the user doesn't have a session yet, so RLS policies block the profile creation

-- First, ensure the handle_new_user function runs with SECURITY DEFINER
-- This allows it to bypass RLS policies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER -- This is crucial - runs with the privileges of the function owner
SET search_path = public -- Ensure we're in the right schema
AS $$
DECLARE
  profile_exists boolean;
BEGIN
  -- Check if profile already exists
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = new.id
  ) INTO profile_exists;

  -- Only create profile if it doesn't exist
  IF NOT profile_exists THEN
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
        COALESCE(new.raw_user_meta_data->>'role', 'client')::user_role,
        NOW(),
        NOW()
      );
      
      -- Log successful creation
      RAISE NOTICE 'Profile created successfully for user %', new.id;
      
    EXCEPTION
      WHEN unique_violation THEN
        -- Profile already exists, update it instead
        UPDATE public.profiles
        SET
          email = new.email,
          first_name = COALESCE(new.raw_user_meta_data->>'first_name', first_name),
          last_name = COALESCE(new.raw_user_meta_data->>'last_name', last_name),
          phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
          updated_at = NOW()
        WHERE id = new.id;
        
        RAISE NOTICE 'Profile updated for existing user %', new.id;
        
      WHEN OTHERS THEN
        -- Log the error with more details
        RAISE WARNING 'Failed to create profile for user %: % (SQLSTATE: %)', new.id, SQLERRM, SQLSTATE;
        -- Don't re-throw the exception - this would prevent user creation
    END;
  ELSE
    RAISE NOTICE 'Profile already exists for user %, skipping creation', new.id;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions to ensure the function can insert into profiles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO anon, authenticated;

-- Ensure the profiles table has proper default values
ALTER TABLE profiles 
  ALTER COLUMN role SET DEFAULT 'client'::user_role,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Add a policy specifically for the service role (used by triggers)
DROP POLICY IF EXISTS "Service role has full access" ON profiles;
CREATE POLICY "Service role has full access" ON profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify existing policies are correct
-- These should already exist but let's ensure they're properly defined
DO $$
BEGIN
  -- Ensure RLS is enabled
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  
  -- Check and create policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Create a function to manually create a profile if needed (for debugging)
CREATE OR REPLACE FUNCTION create_profile_for_user(user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record record;
BEGIN
  -- Get user data
  SELECT * INTO user_record FROM auth.users WHERE id = user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % not found', user_id;
  END IF;
  
  -- Create profile
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
    user_record.id, 
    user_record.email,
    COALESCE(user_record.raw_user_meta_data->>'first_name', ''),
    COALESCE(user_record.raw_user_meta_data->>'last_name', ''),
    user_record.raw_user_meta_data->>'phone',
    COALESCE(user_record.raw_user_meta_data->>'role', 'client')::user_role,
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
    
  RAISE NOTICE 'Profile created/updated for user %', user_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION create_profile_for_user(uuid) TO postgres, service_role;