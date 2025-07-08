-- Drop the existing policy that prevents submission
DROP POLICY IF EXISTS "Users can update own draft forms" ON intake_forms;

-- Create a new policy that allows users to update their own forms for submission
CREATE POLICY "Users can update own forms" ON intake_forms
  FOR UPDATE USING (
    auth.uid() = client_id
    AND (
      -- Allow updates to draft forms
      status = 'draft'
      -- OR allow updating draft to submitted status
      OR (status = 'draft' AND NEW.status = 'submitted')
    )
  );

-- Alternative approach: Create a separate policy for submission
CREATE POLICY "Users can submit own forms" ON intake_forms
  FOR UPDATE USING (
    auth.uid() = client_id
    AND status = 'draft'
  )
  WITH CHECK (
    auth.uid() = client_id
    AND (status = 'draft' OR status = 'submitted')
  );