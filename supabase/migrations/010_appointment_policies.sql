-- Add RLS policies for appointments table

-- Enable RLS on appointments table (if not already enabled)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow guest appointment creation" ON public.appointments;
DROP POLICY IF EXISTS "Users can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow guest profile creation" ON public.profiles;

-- Policy: Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (
        auth.uid() = client_id OR
        is_admin()
    );

-- Policy: Users can create appointments for themselves
CREATE POLICY "Users can create own appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        auth.uid() = client_id
    );

-- Policy: Allow creating appointments without auth (for guests)
-- This requires the API to handle guest profile creation
CREATE POLICY "Allow guest appointment creation" ON public.appointments
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL AND 
        client_id IS NOT NULL
    );

-- Policy: Users can update their own appointments (for cancellations)
CREATE POLICY "Users can update own appointments" ON public.appointments
    FOR UPDATE USING (
        auth.uid() = client_id OR
        is_admin()
    );

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all appointments" ON public.appointments
    FOR ALL USING (is_admin());

-- Add policy for guests to create profiles
CREATE POLICY "Allow guest profile creation" ON public.profiles
    FOR INSERT WITH CHECK (
        auth.uid() IS NULL AND 
        role = 'client'
    );