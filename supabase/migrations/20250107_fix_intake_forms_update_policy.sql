-- Fix intake_forms RLS policy to allow users to submit their forms
-- The issue is that the current policy doesn't properly allow the status transition from 'draft' to 'submitted'

-- First, drop any conflicting policies
DROP POLICY IF EXISTS "Users can update own forms" ON intake_forms;
DROP POLICY IF EXISTS "Users can submit own forms" ON intake_forms;
DROP POLICY IF EXISTS "Users can update own draft forms" ON intake_forms;
DROP POLICY IF EXISTS "Users can update own intake forms" ON intake_forms;

-- Create a comprehensive update policy that allows users to update their own forms
-- This includes transitioning from 'draft' to 'submitted' status
CREATE POLICY "Users can update own intake forms" ON intake_forms
  FOR UPDATE 
  USING (
    auth.uid() = client_id
  )
  WITH CHECK (
    auth.uid() = client_id
    AND (
      -- Allow any updates when form is in draft status
      status = 'draft'
      -- Allow status transition to submitted
      OR (status = 'submitted' AND submitted_at IS NOT NULL)
    )
  );

-- Ensure the insert and select policies exist
-- Check if policies exist before creating
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'intake_forms' 
    AND policyname = 'Users can create own intake forms'
  ) THEN
    CREATE POLICY "Users can create own intake forms" ON intake_forms
      FOR INSERT WITH CHECK (auth.uid() = client_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'intake_forms' 
    AND policyname = 'Users can view own intake forms'
  ) THEN
    CREATE POLICY "Users can view own intake forms" ON intake_forms
      FOR SELECT USING (auth.uid() = client_id);
  END IF;
END $$;

-- Ensure admin policies exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'intake_forms' 
    AND policyname = 'Admins can view all intake forms'
  ) THEN
    CREATE POLICY "Admins can view all intake forms" ON intake_forms
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'intake_forms' 
    AND policyname = 'Admins can update all intake forms'
  ) THEN
    CREATE POLICY "Admins can update all intake forms" ON intake_forms
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;