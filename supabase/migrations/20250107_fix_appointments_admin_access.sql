-- Fix appointments table RLS policies for admin access

-- 1. Check all appointments in the database
SELECT 
    COUNT(*) as total_appointments,
    COUNT(DISTINCT client_id) as unique_clients,
    MIN(appointment_date) as earliest_appointment,
    MAX(appointment_date) as latest_appointment
FROM appointments;

-- 2. Check current RLS policies on appointments table
SELECT 
    policyname,
    cmd,
    qual as using_expression
FROM pg_policies
WHERE tablename = 'appointments'
ORDER BY policyname;

-- 3. Drop ALL existing policies on appointments to start fresh
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON appointments', policy_rec.policyname);
        RAISE NOTICE 'Dropped policy: %', policy_rec.policyname;
    END LOOP;
END $$;

-- 4. Create new policies
-- Clients can view their own appointments
CREATE POLICY "Clients can view own appointments" ON appointments
    FOR SELECT USING (auth.uid() = client_id);

-- Clients can create their own appointments
CREATE POLICY "Clients can create appointments" ON appointments
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Clients can update their own appointments
CREATE POLICY "Clients can update own appointments" ON appointments
    FOR UPDATE USING (auth.uid() = client_id);

-- Admins can view ALL appointments
CREATE POLICY "Admins can view all appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can update ALL appointments
CREATE POLICY "Admins can update all appointments" ON appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can delete appointments
CREATE POLICY "Admins can delete appointments" ON appointments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can insert appointments
CREATE POLICY "Admins can insert appointments" ON appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 5. Ensure RLS is enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- 6. Verify the fix
DO $$
DECLARE
    visible_count INTEGER;
    total_count INTEGER;
    current_user_role TEXT;
BEGIN
    -- Get current user role
    SELECT role INTO current_user_role
    FROM profiles
    WHERE id = auth.uid();
    
    -- Count appointments visible to current user
    SELECT COUNT(*) INTO visible_count FROM appointments;
    
    -- Count total appointments (bypassing RLS)
    SET LOCAL row_security TO OFF;
    SELECT COUNT(*) INTO total_count FROM appointments;
    SET LOCAL row_security TO ON;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== Appointments Access Check ===';
    RAISE NOTICE 'Your role: %', current_user_role;
    RAISE NOTICE 'Appointments you can see: %', visible_count;
    RAISE NOTICE 'Total appointments in system: %', total_count;
    
    IF current_user_role = 'admin' THEN
        IF visible_count = total_count THEN
            RAISE NOTICE 'SUCCESS: As admin, you can see all appointments!';
        ELSE
            RAISE NOTICE 'PROBLEM: As admin, you should see all % appointments but only see %', total_count, visible_count;
        END IF;
    END IF;
    RAISE NOTICE '';
END $$;