# Notification System Setup Guide

## Overview

The SOZA massage booking system includes a comprehensive notification system that sends email reminders and confirmations to clients. This guide explains how to set up and configure the notification system.

## Email Service Setup

### Option 1: Resend (Recommended)

1. Sign up for a free account at [Resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add your domain and verify it
4. Update your `.env.local` file:

```env
RESEND_API_KEY="re_your_api_key_here"
SMTP_FROM="Your Business Name <noreply@yourdomain.com>"
```

### Option 2: SMTP (Alternative)

If you prefer to use your own SMTP server:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="Your Business Name <your-email@gmail.com>"
```

## Database Setup

Run the migration to create notification tables:

```bash
# Apply the notifications migration
supabase migration up
```

## Notification Types

The system supports the following notification types:

1. **Booking Confirmation** - Sent immediately after booking
2. **24-Hour Reminder** - Sent 24 hours before appointment
3. **2-Hour Reminder** - Sent 2 hours before appointment
4. **Cancellation Confirmation** - Sent when appointment is cancelled
5. **Rescheduling Notification** - Sent when appointment is rescheduled
6. **Intake Form Reminder** - Sent to clients who haven't completed forms
7. **Follow-up Email** - Sent after appointment completion

## Automated Processing

### Vercel Cron Jobs (Production)

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/notifications/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Local Development

For local testing, you can manually trigger notification processing:

1. Visit `/dashboard/notifications` in the admin panel
2. Click "Process Queue" to send pending notifications

### External Cron Services

You can also use services like:
- [Cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- GitHub Actions

Example cron endpoint:
```
POST https://yourdomain.com/api/notifications/process
Authorization: Bearer your-cron-secret
```

## Environment Variables

Required environment variables:

```env
# Email Service
RESEND_API_KEY="your-resend-api-key"
SMTP_FROM="Your Business <noreply@yourdomain.com>"

# App Configuration
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_THERAPIST_EMAIL="therapist@yourdomain.com"

# Security
CRON_SECRET="random-secret-for-cron-jobs"
```

## Testing

1. **Send Test Email**: Use the admin dashboard to send test emails
2. **Check Email Logs**: Monitor sent emails in your email service dashboard
3. **View Notification History**: Track all notifications in `/dashboard/notifications`

## Customization

### Email Templates

Email templates are located in `/emails/` directory:
- `booking-confirmation.tsx`
- `appointment-reminder.tsx`
- `cancellation-confirmation.tsx`

To customize:
1. Edit the React Email components
2. Update styles and content
3. Test with the preview tool

### Notification Preferences

Users can manage their preferences at `/dashboard/settings/notifications`:
- Enable/disable email notifications
- Set reminder times
- Choose notification types

## Troubleshooting

### Common Issues

1. **Emails not sending**
   - Check API keys in environment variables
   - Verify domain is properly configured
   - Check notification status in dashboard

2. **Notifications not processing**
   - Ensure cron job is configured
   - Check for errors in notification history
   - Verify CRON_SECRET matches

3. **Email formatting issues**
   - Test templates with different email clients
   - Use React Email preview tool
   - Check for CSS compatibility

### Debug Mode

Enable debug logging:

```typescript
// lib/notifications/email-service.ts
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('Sending email:', { to, subject })
}
```

## SMS Notifications (Future)

The system is prepared for SMS integration using Twilio:

```env
TWILIO_ACCOUNT_SID="your-account-sid"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

SMS functionality can be enabled by implementing the SMS service in the notification system.