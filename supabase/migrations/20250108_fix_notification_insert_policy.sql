-- Allow service role to insert notifications (for API routes)
CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        -- Always allow service role
        auth.role() = 'service_role'
        OR
        -- Also keep admin access
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Drop the old admin-only policy
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;