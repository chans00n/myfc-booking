-- Check and fix appointments table RLS policies

-- 1. First, check all appointments in the database
SELECT 
    COUNT(*) as total_appointments,
    COUNT(DISTINCT client_id) as unique_clients,
    COUNT(DISTINCT therapist_id) as unique_therapists,
    MIN(date) as earliest_appointment,
    MAX(date) as latest_appointment
FROM appointments;

-- 2. Check current RLS policies on appointments table
SELECT 
    policyname,
    cmd,
    roles,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- 3. Drop existing admin policies that might be using the old recursive approach
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;

-- 4. Create new admin policies that check JWT or user metadata
-- Admin can view all appointments
CREATE POLICY "Admins can view all appointments" ON appointments
    FOR SELECT USING (
        -- User's own appointments
        auth.uid() = client_id 
        OR auth.uid() = therapist_id
        -- Admin access via JWT claim
        OR (auth.jwt() ->> 'role')::text = 'admin'
        -- Admin access via auth.users metadata
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
        -- Admin access via profiles table (careful to avoid recursion)
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin can update all appointments
CREATE POLICY "Admins can update all appointments" ON appointments
    FOR UPDATE USING (
        -- Admin access via JWT claim
        (auth.jwt() ->> 'role')::text = 'admin'
        -- Admin access via profiles table
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin can insert appointments
CREATE POLICY "Admins can insert appointments" ON appointments
    FOR INSERT WITH CHECK (
        -- Admin access via JWT claim
        (auth.jwt() ->> 'role')::text = 'admin'
        -- Admin access via profiles table
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin can delete appointments
CREATE POLICY "Admins can delete appointments" ON appointments
    FOR DELETE USING (
        -- Admin access via JWT claim
        (auth.jwt() ->> 'role')::text = 'admin'
        -- Admin access via profiles table
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Test query to see what appointments the current user can see
-- This simulates what the admin dashboard would see
DO $$
DECLARE
    visible_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Count appointments visible to current user
    SELECT COUNT(*) INTO visible_count FROM appointments;
    
    -- Count total appointments (bypassing RLS)
    SET LOCAL row_security TO OFF;
    SELECT COUNT(*) INTO total_count FROM appointments;
    SET LOCAL row_security TO ON;
    
    RAISE NOTICE 'Appointments visible to current user: %', visible_count;
    RAISE NOTICE 'Total appointments in database: %', total_count;
    
    IF visible_count < total_count THEN
        RAISE NOTICE 'RLS is restricting access. Admin policies may need adjustment.';
    END IF;
END $$;

-- 6. Check if RLS is enabled on appointments
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'appointments';

-- 7. Ensure RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;