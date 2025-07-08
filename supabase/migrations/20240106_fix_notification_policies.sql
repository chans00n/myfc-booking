-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;

-- Create new unified SELECT policy that allows both scenarios
CREATE POLICY "Users can view notifications" ON notifications
    FOR SELECT USING (
        -- Users can see their own notifications
        auth.uid() = recipient_id
        OR
        -- Admins can see all notifications
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );