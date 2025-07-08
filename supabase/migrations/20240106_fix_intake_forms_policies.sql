-- Drop the old policy that references completed_at
DROP POLICY IF EXISTS "Users can update own intake forms" ON intake_forms;

-- Create new policy that references submitted_at
CREATE POLICY "Users can update own intake forms" ON intake_forms
    FOR UPDATE USING (
        client_id = auth.uid()
        AND submitted_at IS NULL
    );