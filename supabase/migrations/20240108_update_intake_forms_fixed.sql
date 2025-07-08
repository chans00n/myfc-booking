-- Migration to update existing intake_forms table to support comprehensive intake system
-- This version works with the existing pressure_preference enum

-- First, let's check and potentially update the pressure_preference enum
-- Note: If 'varies' is not in your enum, you'll need to add it first:
-- ALTER TYPE pressure_preference ADD VALUE 'varies';

-- Add new columns to existing intake_forms table
ALTER TABLE intake_forms 
ADD COLUMN IF NOT EXISTS form_type VARCHAR(50) DEFAULT 'new_client' CHECK (form_type IN ('new_client', 'returning_client', 'quick_update')),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'submitted', 'reviewed')),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS medical_conditions JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS surgeries JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS injuries JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS pain_areas JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
ADD COLUMN IF NOT EXISTS current_medications TEXT[],
ADD COLUMN IF NOT EXISTS previous_massage_experience BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS massage_frequency VARCHAR(100),
ADD COLUMN IF NOT EXISTS areas_to_avoid TEXT[],
ADD COLUMN IF NOT EXISTS preferred_techniques TEXT[],
ADD COLUMN IF NOT EXISTS treatment_goals TEXT,
ADD COLUMN IF NOT EXISTS specific_concerns TEXT,
ADD COLUMN IF NOT EXISTS consent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS consent_agreements JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES profiles(id);

-- Handle column renaming if they exist
DO $$ 
BEGIN
    -- Rename completed_at to submitted_at if it exists
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name='intake_forms' AND column_name='completed_at') THEN
        ALTER TABLE intake_forms RENAME COLUMN completed_at TO submitted_at;
    ELSE
        ALTER TABLE intake_forms ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;
    END IF;
    
    -- Rename signature to consent_signature if it exists
    IF EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_name='intake_forms' AND column_name='signature') THEN
        ALTER TABLE intake_forms RENAME COLUMN signature TO consent_signature;
    ELSE
        ALTER TABLE intake_forms ADD COLUMN IF NOT EXISTS consent_signature TEXT;
    END IF;
END $$;

-- Convert text columns to arrays if they're still text type
DO $$ 
BEGIN
    -- Check if medications is TEXT and convert to TEXT[]
    IF EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='intake_forms' 
        AND column_name='medications' 
        AND data_type='text'
    ) THEN
        ALTER TABLE intake_forms 
        ALTER COLUMN medications TYPE TEXT[] USING 
            CASE 
                WHEN medications IS NULL OR medications = '' THEN NULL
                ELSE string_to_array(medications, ',')
            END;
    END IF;
    
    -- Check if allergies is TEXT and convert to TEXT[]
    IF EXISTS(
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='intake_forms' 
        AND column_name='allergies' 
        AND data_type='text'
    ) THEN
        ALTER TABLE intake_forms 
        ALTER COLUMN allergies TYPE TEXT[] USING 
            CASE 
                WHEN allergies IS NULL OR allergies = '' THEN NULL
                ELSE string_to_array(allergies, ',')
            END;
    END IF;
END $$;

-- Make appointment_id nullable (for forms created before appointment booking)
ALTER TABLE intake_forms 
ALTER COLUMN appointment_id DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_intake_forms_client_id ON intake_forms(client_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_appointment_id ON intake_forms(appointment_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_status ON intake_forms(status);
CREATE INDEX IF NOT EXISTS idx_intake_forms_created_at ON intake_forms(created_at);

-- Add date constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_form_dates'
    ) THEN
        ALTER TABLE intake_forms 
        ADD CONSTRAINT valid_form_dates CHECK (
            (submitted_at IS NULL OR submitted_at >= created_at) AND
            (reviewed_at IS NULL OR reviewed_at >= submitted_at)
        );
    END IF;
END $$;

-- Create the additional tables for future extensibility
CREATE TABLE IF NOT EXISTS intake_form_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    form_id UUID NOT NULL REFERENCES intake_forms(id) ON DELETE CASCADE,
    question_key VARCHAR(255) NOT NULL,
    question_text TEXT NOT NULL,
    response_type VARCHAR(50) NOT NULL,
    response_value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(form_id, question_key)
);

CREATE TABLE IF NOT EXISTS intake_form_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    form_type VARCHAR(50) NOT NULL,
    sections JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_intake_form_responses_form_id ON intake_form_responses(form_id);

-- Enable RLS
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_form_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Clients can view own intake forms" ON intake_forms;
DROP POLICY IF EXISTS "Clients can create own intake forms" ON intake_forms;
DROP POLICY IF EXISTS "Clients can update own draft forms" ON intake_forms;
DROP POLICY IF EXISTS "Admins can view all intake forms" ON intake_forms;
DROP POLICY IF EXISTS "Admins can update all intake forms" ON intake_forms;

-- Recreate policies
CREATE POLICY "Clients can view own intake forms" ON intake_forms
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can create own intake forms" ON intake_forms
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own draft forms" ON intake_forms
    FOR UPDATE USING (auth.uid() = client_id AND status = 'draft');

CREATE POLICY "Admins can view all intake forms" ON intake_forms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all intake forms" ON intake_forms
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policies for intake_form_responses
CREATE POLICY "Users can view own form responses" ON intake_form_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM intake_forms
            WHERE intake_forms.id = intake_form_responses.form_id
            AND intake_forms.client_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own form responses" ON intake_form_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM intake_forms
            WHERE intake_forms.id = intake_form_responses.form_id
            AND intake_forms.client_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own form responses" ON intake_form_responses
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM intake_forms
            WHERE intake_forms.id = intake_form_responses.form_id
            AND intake_forms.client_id = auth.uid()
            AND intake_forms.status = 'draft'
        )
    );

-- Admin policies for form responses
CREATE POLICY "Admins can manage all form responses" ON intake_form_responses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Template policies
CREATE POLICY "Anyone can view active templates" ON intake_form_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage templates" ON intake_form_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intake_form_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_intake_forms_updated_at ON intake_forms;
CREATE TRIGGER update_intake_forms_updated_at
    BEFORE UPDATE ON intake_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_intake_form_updated_at();

DROP TRIGGER IF EXISTS update_intake_form_templates_updated_at ON intake_form_templates;
CREATE TRIGGER update_intake_form_templates_updated_at
    BEFORE UPDATE ON intake_form_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_intake_form_updated_at();