-- Create availability-related tables

-- Business hours table
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(day_of_week)
);

-- Time blocks for unavailable periods
CREATE TABLE IF NOT EXISTS public.time_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ NOT NULL,
    block_type TEXT CHECK (block_type IN ('vacation', 'break', 'personal', 'holiday')) DEFAULT 'personal',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- For recurring events (RFC 5545 RRULE format)
    google_event_id TEXT, -- To sync with Google Calendar
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Appointment settings
CREATE TABLE IF NOT EXISTS public.appointment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buffer_time_minutes INTEGER DEFAULT 15, -- Time between appointments
    advance_booking_days INTEGER DEFAULT 30, -- How far in advance clients can book
    minimum_notice_hours INTEGER DEFAULT 24, -- Minimum notice for booking
    cancellation_cutoff_hours INTEGER DEFAULT 24, -- Cancellation deadline
    timezone TEXT DEFAULT 'America/Los_Angeles',
    google_calendar_id TEXT, -- Google Calendar ID for syncing
    google_refresh_token TEXT, -- For Google Calendar API access
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_business_hours_day ON public.business_hours(day_of_week);
CREATE INDEX idx_time_blocks_dates ON public.time_blocks(start_datetime, end_datetime);
CREATE INDEX idx_appointments_datetime ON public.appointments(appointment_date, start_time);

-- RLS Policies for business_hours
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view business hours" ON public.business_hours
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage business hours" ON public.business_hours
    FOR ALL USING (is_admin());

-- RLS Policies for time_blocks
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view time blocks" ON public.time_blocks
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage time blocks" ON public.time_blocks
    FOR ALL USING (is_admin());

-- RLS Policies for appointment_settings
ALTER TABLE public.appointment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view appointment settings" ON public.appointment_settings
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage appointment settings" ON public.appointment_settings
    FOR ALL USING (is_admin());

-- Insert default business hours (Monday-Friday 9 AM - 5 PM)
INSERT INTO public.business_hours (day_of_week, start_time, end_time) VALUES
    (1, '09:00:00', '17:00:00'), -- Monday
    (2, '09:00:00', '17:00:00'), -- Tuesday
    (3, '09:00:00', '17:00:00'), -- Wednesday
    (4, '09:00:00', '17:00:00'), -- Thursday
    (5, '09:00:00', '17:00:00'), -- Friday
    (6, '10:00:00', '14:00:00'), -- Saturday (shorter hours)
    (0, '10:00:00', '14:00:00')  -- Sunday (shorter hours)
ON CONFLICT (day_of_week) DO NOTHING;

-- Insert default appointment settings
INSERT INTO public.appointment_settings (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;