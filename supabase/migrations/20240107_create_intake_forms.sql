-- Create intake forms table
CREATE TABLE IF NOT EXISTS intake_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  form_type VARCHAR(50) NOT NULL CHECK (form_type IN ('new_client', 'returning_client', 'quick_update')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'submitted', 'reviewed')),
  
  -- Personal Information
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  emergency_contact_relationship VARCHAR(100),
  
  -- Health History
  medical_conditions JSONB DEFAULT '[]',
  surgeries JSONB DEFAULT '[]',
  injuries JSONB DEFAULT '[]',
  
  -- Current Health
  pain_areas JSONB DEFAULT '[]',
  pain_level INTEGER CHECK (pain_level >= 0 AND pain_level <= 10),
  current_medications TEXT[],
  allergies TEXT[],
  
  -- Massage Preferences
  previous_massage_experience BOOLEAN DEFAULT false,
  massage_frequency VARCHAR(100),
  pressure_preference VARCHAR(50) CHECK (pressure_preference IN ('light', 'medium', 'firm', 'deep', 'varies')),
  areas_to_avoid TEXT[],
  preferred_techniques TEXT[],
  
  -- Goals and Concerns
  treatment_goals TEXT,
  specific_concerns TEXT,
  
  -- Consent
  consent_signature TEXT, -- Base64 encoded signature
  consent_date TIMESTAMPTZ,
  consent_agreements JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id),
  
  CONSTRAINT valid_form_dates CHECK (
    (submitted_at IS NULL OR submitted_at >= created_at) AND
    (reviewed_at IS NULL OR reviewed_at >= submitted_at)
  )
);

-- Create intake form responses table for flexible form fields
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

-- Create intake form templates table
CREATE TABLE IF NOT EXISTS intake_form_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  form_type VARCHAR(50) NOT NULL,
  sections JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_intake_forms_client_id ON intake_forms(client_id);
CREATE INDEX idx_intake_forms_appointment_id ON intake_forms(appointment_id);
CREATE INDEX idx_intake_forms_status ON intake_forms(status);
CREATE INDEX idx_intake_forms_created_at ON intake_forms(created_at);
CREATE INDEX idx_intake_form_responses_form_id ON intake_form_responses(form_id);

-- RLS Policies
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_form_templates ENABLE ROW LEVEL SECURITY;

-- Clients can view and update their own forms
CREATE POLICY "Clients can view own intake forms" ON intake_forms
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can create own intake forms" ON intake_forms
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own draft forms" ON intake_forms
  FOR UPDATE USING (auth.uid() = client_id AND status = 'draft');

-- Admins can view and update all forms
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

-- Similar policies for intake_form_responses
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

-- Everyone can view active templates
CREATE POLICY "Anyone can view active templates" ON intake_form_templates
  FOR SELECT USING (is_active = true);

-- Only admins can manage templates
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

CREATE TRIGGER update_intake_forms_updated_at
  BEFORE UPDATE ON intake_forms
  FOR EACH ROW
  EXECUTE FUNCTION update_intake_form_updated_at();

CREATE TRIGGER update_intake_form_templates_updated_at
  BEFORE UPDATE ON intake_form_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_intake_form_updated_at();