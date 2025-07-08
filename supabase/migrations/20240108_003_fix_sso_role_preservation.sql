-- Fix SSO login overwriting admin role
-- This updates the handle_new_user function to preserve the role field during updates

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust function that preserves the role field
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
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
        COALESCE(new.raw_user_meta_data->>'role', 'client'),
        NOW(),
        NOW()
      );
    EXCEPTION
      WHEN unique_violation THEN
        -- Profile already exists, update it BUT preserve the role
        UPDATE public.profiles
        SET
          email = new.email,
          first_name = COALESCE(new.raw_user_meta_data->>'first_name', first_name),
          last_name = COALESCE(new.raw_user_meta_data->>'last_name', last_name),
          phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
          -- IMPORTANT: Do not update role field to preserve admin status
          updated_at = NOW()
        WHERE id = new.id;
      WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    END;
  ELSE
    -- Profile exists, update non-role fields only
    UPDATE public.profiles
    SET
      email = new.email,
      -- Only update name fields if they're provided and not empty
      first_name = CASE 
        WHEN new.raw_user_meta_data->>'first_name' IS NOT NULL 
        AND new.raw_user_meta_data->>'first_name' != '' 
        THEN new.raw_user_meta_data->>'first_name'
        ELSE first_name
      END,
      last_name = CASE 
        WHEN new.raw_user_meta_data->>'last_name' IS NOT NULL 
        AND new.raw_user_meta_data->>'last_name' != ''
        THEN new.raw_user_meta_data->>'last_name'
        ELSE last_name
      END,
      phone = CASE 
        WHEN new.raw_user_meta_data->>'phone' IS NOT NULL 
        THEN new.raw_user_meta_data->>'phone'
        ELSE phone
      END,
      -- IMPORTANT: Never update role field during SSO login
      updated_at = NOW()
    WHERE id = new.id;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add a comment to explain the importance of preserving roles
COMMENT ON FUNCTION handle_new_user() IS 'Creates or updates user profiles. IMPORTANT: This function preserves the role field to prevent SSO logins from resetting admin users to client role.';