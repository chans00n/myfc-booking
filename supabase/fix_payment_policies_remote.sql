-- Check if policy exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'payments' 
        AND policyname = 'Clients can create payments for their appointments'
    ) THEN
        -- Add policy to allow clients to create payments for their own appointments
        CREATE POLICY "Clients can create payments for their appointments"
          ON payments FOR INSERT
          WITH CHECK (
            auth.uid() = client_id
            AND EXISTS (
              SELECT 1 FROM appointments
              WHERE appointments.id = payments.appointment_id
              AND appointments.client_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Also add policy for payment_events if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'payment_events' 
        AND policyname = 'Service role can manage payment events'
    ) THEN
        CREATE POLICY "Service role can manage payment events"
          ON payment_events FOR ALL
          USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Also allow clients to insert their own payment events
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'payment_events' 
        AND policyname = 'Clients can create payment events for their payments'
    ) THEN
        CREATE POLICY "Clients can create payment events for their payments"
          ON payment_events FOR INSERT
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM payments
              WHERE payments.id = payment_events.payment_id
              AND payments.client_id = auth.uid()
            )
          );
    END IF;
END $$;