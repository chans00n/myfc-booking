-- Create notification_type enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE notification_type AS ENUM (
      'booking_confirmation',
      'appointment_reminder_24h',
      'appointment_reminder_2h',
      'cancellation_confirmation',
      'rescheduling_notification',
      'intake_form_reminder',
      'follow_up',
      'therapist_new_booking',
      'therapist_cancellation',
      'consultation_confirmation',
      'consultation_24h_reminder',
      'consultation_1h_reminder',
      'consultation_15min_reminder',
      'consultation_followup',
      'admin_consultation_booked',
      'admin_consultation_joined',
      'admin_consultation_completed',
      'admin_consultation_digest'
    );
  ELSE
    -- Add consultation-specific notification types if they don't exist
    -- Note: We can't use IF NOT EXISTS with ALTER TYPE, so we need to check manually
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consultation_confirmation' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'consultation_confirmation';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consultation_24h_reminder' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'consultation_24h_reminder';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consultation_1h_reminder' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'consultation_1h_reminder';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consultation_15min_reminder' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'consultation_15min_reminder';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'consultation_followup' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'consultation_followup';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_consultation_booked' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'admin_consultation_booked';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_consultation_joined' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'admin_consultation_joined';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_consultation_completed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'admin_consultation_completed';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin_consultation_digest' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')) THEN
      ALTER TYPE notification_type ADD VALUE 'admin_consultation_digest';
    END IF;
  END IF;
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id uuid REFERENCES profiles(id),
  recipient_email text NOT NULL,
  recipient_phone text,
  type notification_type NOT NULL,
  channel notification_channel DEFAULT 'email',
  subject text,
  content text,
  metadata jsonb,
  appointment_id uuid,
  scheduled_for timestamp with time zone NOT NULL,
  sent_at timestamp with time zone,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  error_message text,
  retry_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add reference_type and reference_id columns to notifications table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notifications' 
                AND column_name = 'reference_type') THEN
    ALTER TABLE notifications ADD COLUMN reference_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notifications' 
                AND column_name = 'reference_id') THEN
    ALTER TABLE notifications ADD COLUMN reference_id uuid;
  END IF;
END $$;

-- Create notification_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) UNIQUE,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT true,
  booking_confirmation boolean DEFAULT true,
  appointment_reminder_24h boolean DEFAULT true,
  appointment_reminder_2h boolean DEFAULT true,
  reminder_time_24h time,
  reminder_time_2h time,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add consultation notification preferences to notification_preferences table
DO $$ 
BEGIN
  -- Add consultation notification columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'notification_preferences' 
                AND column_name = 'consultation_confirmation') THEN
    ALTER TABLE notification_preferences 
    ADD COLUMN consultation_confirmation boolean DEFAULT true,
    ADD COLUMN consultation_24h_reminder boolean DEFAULT true,
    ADD COLUMN consultation_1h_reminder boolean DEFAULT true,
    ADD COLUMN consultation_15min_reminder boolean DEFAULT false,
    ADD COLUMN consultation_followup boolean DEFAULT true,
    ADD COLUMN admin_consultation_booked boolean DEFAULT true,
    ADD COLUMN admin_consultation_joined boolean DEFAULT true,
    ADD COLUMN admin_consultation_completed boolean DEFAULT true,
    ADD COLUMN admin_consultation_digest boolean DEFAULT true;
  END IF;
END $$;

-- Create notification_channel enum if it doesn't exist, or add SMS channel
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_channel') THEN
    CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'push', 'in_app');
  ELSE
    -- Add SMS channel if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'sms' 
      AND enumtypid = (
        SELECT oid FROM pg_type WHERE typname = 'notification_channel'
      )
    ) THEN
      ALTER TYPE notification_channel ADD VALUE 'sms';
    END IF;
  END IF;
END $$;

-- Create index on reference_type and reference_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_reference 
ON notifications(reference_type, reference_id) 
WHERE reference_type IS NOT NULL AND reference_id IS NOT NULL;

-- Create index for consultation notifications
CREATE INDEX IF NOT EXISTS idx_notifications_consultation_type 
ON notifications(type) 
WHERE type IN (
  'consultation_confirmation',
  'consultation_24h_reminder',
  'consultation_1h_reminder',
  'consultation_15min_reminder',
  'consultation_followup'
);