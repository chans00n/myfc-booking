-- Create notification_settings table for user preferences
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    appointment_confirmations BOOLEAN DEFAULT true,
    appointment_reminders BOOLEAN DEFAULT true,
    appointment_cancellations BOOLEAN DEFAULT true,
    reminder_hours_before INTEGER DEFAULT 24,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for user lookup
CREATE INDEX idx_notification_settings_user_id ON notification_settings(user_id);

-- Enable RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at
CREATE TRIGGER update_notification_settings_updated_at 
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default settings for existing users
INSERT INTO notification_settings (user_id)
SELECT id FROM profiles
WHERE id NOT IN (SELECT user_id FROM notification_settings)
ON CONFLICT (user_id) DO NOTHING;