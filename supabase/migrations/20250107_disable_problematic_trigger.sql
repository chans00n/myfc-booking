-- Disable the problematic trigger and let the application handle profile creation
-- This is a temporary fix to get signup working immediately

-- Drop the trigger that's causing issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Keep the function for reference but don't use it
-- DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Ensure RLS policies are simple and working
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recreate clean policies
DROP POLICY IF EXISTS "Enable read access for users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users" ON profiles;

-- Allow users to manage their own profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Ensure the table has proper defaults
ALTER TABLE profiles 
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- Create any missing profiles for existing users
INSERT INTO profiles (id, email, role, created_at, updated_at)
SELECT 
  id, 
  email,
  'client',
  COALESCE(created_at, NOW()),
  NOW()
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;