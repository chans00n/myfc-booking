-- Fix RLS policies for consultations to allow clients to create their own consultations

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can manage consultations" ON consultations;

-- Create new policy that allows authenticated users to create consultations for themselves
CREATE POLICY "Users can create own consultations" ON consultations
    FOR INSERT
    WITH CHECK (
        auth.uid() = client_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Allow users to update their own consultations
CREATE POLICY "Users can update own consultations" ON consultations
    FOR UPDATE
    USING (
        auth.uid() = client_id OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Also fix appointments table to allow consultation appointments
-- First drop if exists
DROP POLICY IF EXISTS "Users can create consultation appointments" ON appointments;

CREATE POLICY "Users can create consultation appointments" ON appointments
    FOR INSERT
    WITH CHECK (
        -- Allow if it's a consultation service (free)
        EXISTS (
            SELECT 1 FROM services
            WHERE services.id = service_id
            AND services.is_consultation = true
            AND services.price_cents = 0
        )
        AND auth.uid() = client_id
    );

-- Fix intake_forms to allow consultation forms
-- First drop if exists
DROP POLICY IF EXISTS "Users can create consultation intake forms" ON intake_forms;

CREATE POLICY "Users can create consultation intake forms" ON intake_forms
    FOR INSERT
    WITH CHECK (
        auth.uid() = client_id
        AND form_category = 'consultation'
    );