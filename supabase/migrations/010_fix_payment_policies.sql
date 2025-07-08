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

-- Also add policy for payment_events
CREATE POLICY "Service role can manage payment events"
  ON payment_events FOR ALL
  USING (auth.role() = 'service_role');