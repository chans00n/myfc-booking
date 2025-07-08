-- Create payments table to track all payment transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  
  -- Stripe payment information
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_payment_method_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Payment details
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_method_type VARCHAR(50) DEFAULT 'card',
  
  -- Additional payment info
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Receipt information
  receipt_url TEXT,
  receipt_number VARCHAR(100),
  
  -- Refund tracking
  refunded_amount_cents INTEGER DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled', 'partially_refunded', 'refunded')),
  CONSTRAINT valid_refund CHECK (refunded_amount_cents <= amount_cents),
  CONSTRAINT valid_payment_method CHECK (payment_method_type IN ('card', 'bank_transfer', 'cash'))
);

-- Create payment_events table to track payment lifecycle events
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Event information
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB DEFAULT '{}',
  stripe_event_id VARCHAR(255),
  
  -- Error tracking
  error_code VARCHAR(100),
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_stripe_event UNIQUE(stripe_event_id)
);

-- Create indexes for better performance
CREATE INDEX idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX idx_payment_events_created_at ON payment_events(created_at DESC);

-- Enable RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Clients can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Admin can view all payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies for payment_events
CREATE POLICY "Clients can view their own payment events"
  ON payment_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_events.payment_id
      AND payments.client_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all payment events"
  ON payment_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage payment events"
  ON payment_events FOR ALL
  USING (auth.role() = 'service_role');

-- Update appointments table to track payment status
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id),
ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deposit_amount_cents INTEGER DEFAULT 0;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for payments table
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Create function to generate receipt numbers
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  sequence_num INTEGER;
  receipt_num TEXT;
BEGIN
  -- Get current year and month
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- Get the next sequence number for this month
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM payments
  WHERE TO_CHAR(created_at, 'YYYYMM') = year_month
  AND receipt_number IS NOT NULL;
  
  -- Generate receipt number: RCPT-YYYYMM-XXXX
  receipt_num := 'RCPT-' || year_month || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN receipt_num;
END;
$$ LANGUAGE plpgsql;