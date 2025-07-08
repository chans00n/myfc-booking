-- Create profiles for any existing auth users that don't have profiles
INSERT INTO public.profiles (id, email, first_name, last_name, phone, role, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', ''),
    COALESCE(au.raw_user_meta_data->>'last_name', ''),
    au.raw_user_meta_data->>'phone',
    COALESCE((au.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
    COALESCE(au.created_at, NOW()),
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Check if the trigger exists and is enabled
SELECT 
    tgname AS trigger_name,
    tgenabled AS is_enabled,
    pg_get_triggerdef(oid) AS trigger_definition
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Let's also create a simpler trigger that's less likely to fail
DROP TRIGGER IF EXISTS ensure_profile_exists ON auth.users;
DROP FUNCTION IF EXISTS create_profile_for_user();

CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (NEW.id, NEW.email, 'client'::user_role)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a backup trigger
CREATE TRIGGER ensure_profile_exists
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();

-- Also fix the previous trigger function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only insert if profile doesn't already exist
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
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client'::user_role),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
    last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();
    
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the signup
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the main trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();