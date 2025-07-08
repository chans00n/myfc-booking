-- Add Stripe customer ID to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255) UNIQUE;