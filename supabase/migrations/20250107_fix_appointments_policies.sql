-- Check appointments table structure and fix RLS policies

-- 1. First, check the actual columns in appointments table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'appointments'
ORDER BY ordinal_position;

-- 2. Check all appointments in the database (with actual columns)
SELECT 
    COUNT(*) as total_appointments,
    COUNT(DISTINCT client_id) as unique_clients,
    MIN(date) as earliest_appointment,
    MAX(date) as latest_appointment
FROM appointments;

-- 3. Check current RLS policies on appointments table
SELECT 
    policyname,
    cmd,
    roles,
    qual as using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- 4. Drop existing admin policies
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can update all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can insert appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON appointments;

-- 5. Create simple admin policies that work
-- Admin can view all appointments
CREATE POLICY "Admins can view all appointments" ON appointments
    FOR SELECT USING (
        -- User's own appointments
        auth.uid() = client_id 
        -- Admin access - simple check against profiles table
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin can manage all appointments
CREATE POLICY "Admins can manage all appointments" ON appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 6. Verify the fix
DO $$
DECLARE
    visible_count INTEGER;
    total_count INTEGER;
    current_user_id UUID;
    user_role TEXT;
BEGIN
    -- Get current user info
    current_user_id := auth.uid();
    
    -- Get user role
    SELECT role INTO user_role
    FROM profiles
    WHERE id = current_user_id;
    
    -- Count appointments visible to current user
    SELECT COUNT(*) INTO visible_count FROM appointments;
    
    -- Count total appointments (bypassing RLS)
    SET LOCAL row_security TO OFF;
    SELECT COUNT(*) INTO total_count FROM appointments;
    SET LOCAL row_security TO ON;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Appointments Access Check ===';
    RAISE NOTICE 'Current user ID: %', current_user_id;
    RAISE NOTICE 'Current user role: %', user_role;
    RAISE NOTICE 'Appointments visible: %', visible_count;
    RAISE NOTICE 'Total appointments: %', total_count;
    
    IF user_role = 'admin' AND visible_count < total_count THEN
        RAISE NOTICE 'WARNING: Admin cannot see all appointments!';
    ELSIF user_role = 'admin' AND visible_count = total_count THEN
        RAISE NOTICE 'SUCCESS: Admin can see all appointments!';
    END IF;
    RAISE NOTICE '';
END $$;

-- 7. Also check other tables that admins need access to
-- Check intake_forms policies
SELECT 
    'Intake Forms Policies:' as info;
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'intake_forms'
AND policyname LIKE '%admin%'
ORDER BY policyname;

-- 8. Ensure RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;