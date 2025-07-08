-- Update payment_status enum to include 'will_pay_later'
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'will_pay_later';