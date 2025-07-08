-- Add consultation system to SOZA
-- This migration adds support for free consultations with video/phone capabilities

-- 1. Create service_type enum
CREATE TYPE service_type AS ENUM ('massage', 'consultation');

-- 2. Update SERVICES table with consultation fields
ALTER TABLE services 
ADD COLUMN service_type service_type NOT NULL DEFAULT 'massage',
ADD COLUMN is_consultation BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN consultation_limit INTEGER DEFAULT NULL;

-- 3. Create consultation_type enum
CREATE TYPE consultation_type AS ENUM ('phone', 'video', 'in_person');

-- 4. Create consultation_status enum
CREATE TYPE consultation_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- 5. Create CONSULTATIONS table
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consultation_type consultation_type NOT NULL,
    daily_room_url TEXT,
    daily_room_name TEXT,
    daily_room_token TEXT,
    consultation_notes TEXT,
    client_goals TEXT,
    health_overview TEXT,
    follow_up_scheduled BOOLEAN DEFAULT false,
    consultation_status consultation_status NOT NULL DEFAULT 'scheduled',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for consultations
CREATE INDEX idx_consultations_appointment_id ON consultations(appointment_id);
CREATE INDEX idx_consultations_client_id ON consultations(client_id);
CREATE INDEX idx_consultations_status ON consultations(consultation_status);

-- 6. Create form_type enum for intake forms
CREATE TYPE intake_form_type AS ENUM ('full_intake', 'consultation', 'health_update');

-- 7. Create contact_method enum
CREATE TYPE contact_method AS ENUM ('phone', 'video', 'in_person');

-- 8. Update INTAKE_FORMS table
ALTER TABLE intake_forms
ADD COLUMN form_category intake_form_type DEFAULT 'full_intake',
ADD COLUMN preferred_contact_method contact_method,
ADD COLUMN best_time_to_call TEXT,
ADD COLUMN primary_concerns TEXT,
ADD COLUMN massage_goals TEXT,
ADD COLUMN previous_massage_therapy TEXT;

-- 9. Update PROFILES table with consultation tracking
ALTER TABLE profiles
ADD COLUMN consultation_count INTEGER DEFAULT 0,
ADD COLUMN last_consultation_date TIMESTAMPTZ,
ADD COLUMN has_had_free_consultation BOOLEAN DEFAULT false;

-- 10. Create function to check consultation eligibility
CREATE OR REPLACE FUNCTION check_consultation_eligibility(p_client_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_consultation_count INTEGER;
    v_has_had_free BOOLEAN;
BEGIN
    -- Get consultation stats for the client
    SELECT 
        consultation_count,
        has_had_free_consultation
    INTO 
        v_consultation_count,
        v_has_had_free
    FROM profiles
    WHERE id = p_client_id;

    -- Client is eligible if they haven't had a free consultation
    RETURN NOT COALESCE(v_has_had_free, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to create consultation appointment
CREATE OR REPLACE FUNCTION create_consultation_appointment(
    p_client_id UUID,
    p_appointment_date DATE,
    p_start_time TIME,
    p_consultation_type consultation_type,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_service_id UUID;
    v_appointment_id UUID;
    v_consultation_id UUID;
    v_end_time TIME;
BEGIN
    -- Check eligibility
    IF NOT check_consultation_eligibility(p_client_id) THEN
        RAISE EXCEPTION 'Client has already used their free consultation';
    END IF;

    -- Get consultation service ID
    SELECT id INTO v_service_id
    FROM services
    WHERE is_consultation = true
    AND is_active = true
    LIMIT 1;

    IF v_service_id IS NULL THEN
        RAISE EXCEPTION 'No active consultation service found';
    END IF;

    -- Calculate end time (30 minutes)
    v_end_time := p_start_time + INTERVAL '30 minutes';

    -- Create appointment
    INSERT INTO appointments (
        client_id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        status,
        total_price_cents,
        payment_status,
        requires_payment,
        notes
    ) VALUES (
        p_client_id,
        v_service_id,
        p_appointment_date,
        p_start_time,
        v_end_time,
        'scheduled',
        0,
        'paid', -- Free consultation
        false,
        p_notes
    ) RETURNING id INTO v_appointment_id;

    -- Create consultation record
    INSERT INTO consultations (
        appointment_id,
        client_id,
        consultation_type,
        consultation_status
    ) VALUES (
        v_appointment_id,
        p_client_id,
        p_consultation_type,
        'scheduled'
    ) RETURNING id INTO v_consultation_id;

    -- Update client profile
    UPDATE profiles
    SET 
        has_had_free_consultation = true,
        consultation_count = COALESCE(consultation_count, 0) + 1
    WHERE id = p_client_id;

    RETURN v_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to update consultation status
CREATE OR REPLACE FUNCTION update_consultation_status(
    p_consultation_id UUID,
    p_status consultation_status,
    p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Get client ID
    SELECT client_id INTO v_client_id
    FROM consultations
    WHERE id = p_consultation_id;

    -- Update consultation
    UPDATE consultations
    SET 
        consultation_status = p_status,
        started_at = CASE 
            WHEN p_status = 'in_progress' AND started_at IS NULL 
            THEN NOW() 
            ELSE started_at 
        END,
        completed_at = CASE 
            WHEN p_status = 'completed' 
            THEN NOW() 
            ELSE completed_at 
        END,
        consultation_notes = COALESCE(p_notes, consultation_notes),
        updated_at = NOW()
    WHERE id = p_consultation_id;

    -- Update appointment status
    UPDATE appointments
    SET 
        status = CASE 
            WHEN p_status = 'completed' THEN 'completed'
            WHEN p_status = 'cancelled' THEN 'cancelled'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = (
        SELECT appointment_id 
        FROM consultations 
        WHERE id = p_consultation_id
    );

    -- Update last consultation date if completed
    IF p_status = 'completed' THEN
        UPDATE profiles
        SET last_consultation_date = NOW()
        WHERE id = v_client_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Add trigger to update updated_at for consultations
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 14. RLS Policies for consultations table
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Admin can view all consultations
CREATE POLICY "Admin can view all consultations" ON consultations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin can manage all consultations
CREATE POLICY "Admin can manage consultations" ON consultations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Clients can view their own consultations
CREATE POLICY "Clients can view own consultations" ON consultations
    FOR SELECT
    USING (client_id = auth.uid());

-- 15. Insert consultation service
INSERT INTO services (
    name,
    description,
    duration_minutes,
    price_cents,
    service_type,
    is_consultation,
    consultation_limit,
    is_active
) VALUES (
    'Free Consultation',
    'A complimentary 30-minute consultation to discuss your health goals and create a personalized massage therapy plan. Available via phone, video call, or in-person.',
    30,
    0,
    'consultation',
    true,
    1,
    true
);

-- 16. Create view for consultation availability
CREATE OR REPLACE VIEW client_consultation_eligibility AS
SELECT 
    p.id AS client_id,
    p.first_name,
    p.last_name,
    p.email,
    p.consultation_count,
    p.last_consultation_date,
    p.has_had_free_consultation,
    check_consultation_eligibility(p.id) AS is_eligible
FROM profiles p
WHERE p.role = 'client';

-- Grant permissions
GRANT SELECT ON client_consultation_eligibility TO authenticated;

-- 17. Add helper function to get consultation details
CREATE OR REPLACE FUNCTION get_consultation_details(p_appointment_id UUID)
RETURNS TABLE (
    consultation_id UUID,
    consultation_type consultation_type,
    consultation_status consultation_status,
    daily_room_url TEXT,
    consultation_notes TEXT,
    client_goals TEXT,
    health_overview TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.consultation_type,
        c.consultation_status,
        c.daily_room_url,
        c.consultation_notes,
        c.client_goals,
        c.health_overview,
        c.started_at,
        c.completed_at
    FROM consultations c
    WHERE c.appointment_id = p_appointment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Add function to check if appointment is consultation
CREATE OR REPLACE FUNCTION is_consultation_appointment(p_appointment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_consultation BOOLEAN;
BEGIN
    SELECT s.is_consultation INTO v_is_consultation
    FROM appointments a
    JOIN services s ON a.service_id = s.id
    WHERE a.id = p_appointment_id;
    
    RETURN COALESCE(v_is_consultation, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION check_consultation_eligibility(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_consultation_appointment(UUID, DATE, TIME, consultation_type, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_consultation_status(UUID, consultation_status, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_consultation_details(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_consultation_appointment(UUID) TO authenticated;