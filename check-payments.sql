-- Check if there are any payments in the database
SELECT COUNT(*) as total_payments FROM payments;

-- Check payments for a specific user (replace with your user ID)
-- SELECT * FROM payments WHERE client_id = 'YOUR_USER_ID' ORDER BY created_at DESC;

-- Check if payments are linked to appointments
SELECT 
  p.id,
  p.amount_cents,
  p.status,
  p.created_at,
  p.stripe_payment_intent_id,
  a.id as appointment_id,
  a.appointment_date,
  pr.email as client_email
FROM payments p
LEFT JOIN appointments a ON p.appointment_id = a.id
LEFT JOIN profiles pr ON p.client_id = pr.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Check if there are any payment events
SELECT COUNT(*) as total_events FROM payment_events;

-- Check the appointments table to see payment_status
SELECT 
  id,
  appointment_date,
  payment_status,
  payment_id,
  total_price_cents
FROM appointments 
WHERE payment_status = 'paid'
LIMIT 10;
EOF < /dev/null