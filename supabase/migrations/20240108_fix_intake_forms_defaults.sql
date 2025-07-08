-- Fix default values for intake_forms table

-- Update any existing rows that might have NULL values for required fields
UPDATE intake_forms 
SET 
  form_type = COALESCE(form_type, 'new_client'),
  status = COALESCE(status, 'draft'),
  medical_conditions = COALESCE(medical_conditions, '[]'::jsonb),
  surgeries = COALESCE(surgeries, '[]'::jsonb),
  injuries = COALESCE(injuries, '[]'::jsonb),
  pain_areas = COALESCE(pain_areas, '[]'::jsonb),
  consent_agreements = COALESCE(consent_agreements, '{}'::jsonb),
  previous_massage_experience = COALESCE(previous_massage_experience, false),
  updated_at = COALESCE(updated_at, NOW())
WHERE 
  form_type IS NULL 
  OR status IS NULL 
  OR medical_conditions IS NULL 
  OR surgeries IS NULL 
  OR injuries IS NULL 
  OR pain_areas IS NULL 
  OR consent_agreements IS NULL 
  OR previous_massage_experience IS NULL
  OR updated_at IS NULL;

-- Ensure default values are set for new columns
ALTER TABLE intake_forms 
ALTER COLUMN form_type SET DEFAULT 'new_client',
ALTER COLUMN status SET DEFAULT 'draft',
ALTER COLUMN medical_conditions SET DEFAULT '[]'::jsonb,
ALTER COLUMN surgeries SET DEFAULT '[]'::jsonb,
ALTER COLUMN injuries SET DEFAULT '[]'::jsonb,
ALTER COLUMN pain_areas SET DEFAULT '[]'::jsonb,
ALTER COLUMN consent_agreements SET DEFAULT '{}'::jsonb,
ALTER COLUMN previous_massage_experience SET DEFAULT false,
ALTER COLUMN updated_at SET DEFAULT NOW();