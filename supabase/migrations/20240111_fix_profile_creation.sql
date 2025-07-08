-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust function with error handling
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
        -- Profile already exists, update it instead
        UPDATE public.profiles
        SET
          email = new.email,
          first_name = COALESCE(new.raw_user_meta_data->>'first_name', first_name),
          last_name = COALESCE(new.raw_user_meta_data->>'last_name', last_name),
          phone = COALESCE(new.raw_user_meta_data->>'phone', phone),
          updated_at = NOW()
        WHERE id = new.id;
      WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Failed to create profile for user %: %', new.id, SQLERRM;
    END;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure all existing users have profiles
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'client',
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;