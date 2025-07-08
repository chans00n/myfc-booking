-- Ensure admins can view all profiles (needed for appointments page)

-- Check current profiles policies
SELECT 
    policyname,
    cmd,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'profiles'
AND policyname LIKE '%admin%'
ORDER BY policyname;

-- Drop the problematic admin view policy if it exists
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate admin view policy to ensure it works properly
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        -- Users can always see their own profile
        auth.uid() = id
        OR
        -- Admins can see all profiles
        EXISTS (
            SELECT 1 FROM profiles admin_profile
            WHERE admin_profile.id = auth.uid()
            AND admin_profile.role = 'admin'
        )
    );

-- Also ensure the services table has proper policies
-- Check if services table has RLS enabled
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'services';

-- Enable RLS on services if not already enabled
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create policy for everyone to view services (they're public)
DROP POLICY IF EXISTS "Anyone can view services" ON services;
CREATE POLICY "Anyone can view services" ON services
    FOR SELECT USING (true);

-- Only admins can manage services
DROP POLICY IF EXISTS "Admins can manage services" ON services;
CREATE POLICY "Admins can manage services" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Test the fix by checking what an admin can see
DO $$
DECLARE
    profile_count INTEGER;
    service_count INTEGER;
    current_role TEXT;
BEGIN
    -- Get current user role
    SELECT role INTO current_role
    FROM profiles
    WHERE id = auth.uid();
    
    -- Count visible profiles
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    -- Count visible services
    SELECT COUNT(*) INTO service_count FROM services;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Admin Access Check ===';
    RAISE NOTICE 'Your role: %', current_role;
    RAISE NOTICE 'Profiles you can see: %', profile_count;
    RAISE NOTICE 'Services you can see: %', service_count;
    
    IF current_role = 'admin' THEN
        RAISE NOTICE 'As an admin, you should be able to see all profiles and services.';
    END IF;
    RAISE NOTICE '';
END $$;