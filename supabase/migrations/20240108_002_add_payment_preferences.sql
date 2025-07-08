-- Add payment preference enum type
CREATE TYPE payment_preference AS ENUM ('pay_now', 'pay_at_appointment', 'pay_cash');

-- Add payment_preference column to appointments table
ALTER TABLE appointments 
ADD COLUMN payment_preference payment_preference DEFAULT 'pay_at_appointment';

-- Make stripe_payment_intent_id nullable (it already should be, but let's ensure)
ALTER TABLE appointments 
ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;

-- Add payment_collected_at timestamp for tracking when payment was collected
ALTER TABLE appointments
ADD COLUMN payment_collected_at TIMESTAMP WITH TIME ZONE;

-- Add payment_collection_method to track how payment was collected
CREATE TYPE payment_collection_method AS ENUM ('online', 'in_person_card', 'cash', 'check', 'other');

ALTER TABLE appointments
ADD COLUMN payment_collection_method payment_collection_method;

-- Create a payment_collections table for tracking manual payment collection
CREATE TABLE payment_collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
    collected_by UUID NOT NULL REFERENCES profiles(id),
    amount_cents INTEGER NOT NULL,
    collection_method payment_collection_method NOT NULL,
    payment_reference TEXT, -- For check numbers, transaction IDs, etc.
    notes TEXT,
    collected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS policies for payment_collections
ALTER TABLE payment_collections ENABLE ROW LEVEL SECURITY;

-- Admin users can view and create payment collections
CREATE POLICY "Admin users can manage payment collections" ON payment_collections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Clients can view their own payment collections
CREATE POLICY "Clients can view their payment collections" ON payment_collections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM appointments
            WHERE appointments.id = payment_collections.appointment_id
            AND appointments.client_id = auth.uid()
        )
    );

-- Update existing appointments to have a payment preference based on their payment status
UPDATE appointments
SET payment_preference = CASE
    WHEN payment_status = 'paid' THEN 'pay_now'::payment_preference
    WHEN payment_status = 'pending' AND stripe_payment_intent_id IS NOT NULL THEN 'pay_now'::payment_preference
    ELSE 'pay_at_appointment'::payment_preference
END
WHERE payment_preference IS NULL;

-- Update payment_status for appointments without payment intent
UPDATE appointments
SET payment_status = 'will_pay_later'
WHERE payment_status = 'pending' 
AND stripe_payment_intent_id IS NULL
AND status IN ('scheduled', 'confirmed');