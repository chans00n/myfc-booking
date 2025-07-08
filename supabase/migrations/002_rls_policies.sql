-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Services policies
-- Everyone can view active services
CREATE POLICY "Everyone can view active services" ON services
    FOR SELECT USING (is_active = true);

-- Only admins can insert services
CREATE POLICY "Admins can insert services" ON services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update services
CREATE POLICY "Admins can update services" ON services
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete services
CREATE POLICY "Admins can delete services" ON services
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Appointments policies
-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
    FOR SELECT USING (client_id = auth.uid());

-- Users can create their own appointments
CREATE POLICY "Users can create own appointments" ON appointments
    FOR INSERT WITH CHECK (client_id = auth.uid());

-- Users can update their own appointments (for cancellation)
CREATE POLICY "Users can update own appointments" ON appointments
    FOR UPDATE USING (
        client_id = auth.uid() 
        AND status IN ('scheduled', 'confirmed')
    );

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments" ON appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admins can update all appointments
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

-- Intake forms policies
-- Users can view their own intake forms
CREATE POLICY "Users can view own intake forms" ON intake_forms
    FOR SELECT USING (client_id = auth.uid());

-- Users can create their own intake forms
CREATE POLICY "Users can create own intake forms" ON intake_forms
    FOR INSERT WITH CHECK (client_id = auth.uid());

-- Users can update their own intake forms
CREATE POLICY "Users can update own intake forms" ON intake_forms
    FOR UPDATE USING (
        client_id = auth.uid()
        AND completed_at IS NULL
    );

-- Admins can view all intake forms
CREATE POLICY "Admins can view all intake forms" ON intake_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Create a function to check for appointment conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict(
    p_service_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM appointments
        WHERE appointment_date = p_appointment_date
        AND status IN ('scheduled', 'confirmed')
        AND (
            (start_time <= p_start_time AND end_time > p_start_time) OR
            (start_time < p_end_time AND end_time >= p_end_time) OR
            (start_time >= p_start_time AND end_time <= p_end_time)
        )
        AND (p_appointment_id IS NULL OR id != p_appointment_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Create a function to get available time slots
CREATE OR REPLACE FUNCTION get_available_slots(
    p_service_id UUID,
    p_date DATE
)
RETURNS TABLE (
    start_time TIME,
    end_time TIME
) AS $$
DECLARE
    v_duration INTEGER;
    v_slot_start TIME := '09:00:00';
    v_slot_end TIME;
    v_day_end TIME := '17:00:00';
BEGIN
    -- Get service duration
    SELECT duration_minutes INTO v_duration
    FROM services
    WHERE id = p_service_id;
    
    -- Generate available slots
    WHILE v_slot_start < v_day_end LOOP
        v_slot_end := v_slot_start + (v_duration || ' minutes')::INTERVAL;
        
        -- Check if slot is available
        IF NOT check_appointment_conflict(p_service_id, p_date, v_slot_start, v_slot_end) 
           AND v_slot_end <= v_day_end THEN
            RETURN QUERY SELECT v_slot_start, v_slot_end;
        END IF;
        
        -- Move to next slot (30-minute intervals)
        v_slot_start := v_slot_start + INTERVAL '30 minutes';
    END LOOP;
END;
$$ LANGUAGE plpgsql;