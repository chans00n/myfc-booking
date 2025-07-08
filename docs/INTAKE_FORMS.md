# Intake Forms System Documentation

## Overview

The intake forms system provides a comprehensive digital health intake process for massage therapy clients. It includes multi-step forms, digital signatures, and intelligent form selection based on client history.

## Features

### 1. Form Types
- **New Client Form**: Comprehensive intake for first-time clients
- **Returning Client Form**: Full form for clients returning after 90+ days
- **Quick Update Form**: Brief update for regular clients (30-90 days)

### 2. Form Sections
- Personal Information
- Health History (medical conditions, surgeries, injuries)
- Current Health Status (pain areas, medications, allergies)
- Massage Preferences
- Treatment Goals
- Consent & Digital Signature

### 3. Key Capabilities
- Auto-save drafts every 30 seconds
- Digital signature capture
- Mobile-responsive design
- Integration with booking flow
- Admin management dashboard
- Email notifications (when configured)

## Database Schema

### Tables
- `intake_forms`: Main form records
- `intake_form_responses`: Future use for custom forms
- `intake_form_templates`: Future use for custom templates

## Integration Points

### Booking Flow
The intake form is automatically integrated into the booking wizard:
1. System checks if client needs a new form
2. Appropriate form type is selected based on history
3. Form is linked to the appointment
4. Completion is required before payment

### Admin Dashboard
- View all submitted forms
- Filter by status (submitted, reviewed, draft)
- Search by client name/email
- Mark forms as reviewed
- View complete form details

## Email Notifications

The system includes email notification templates for:
- Client confirmation when form is submitted
- Therapist notification of new forms
- Reminder emails for incomplete forms
- Quick update notifications

**Note**: Email sending requires backend configuration with an email service provider.

## Usage

### For Clients
1. Forms are presented during booking based on their history
2. Can save progress and return later
3. Digital signature required for submission
4. Receive confirmation email upon completion

### For Admins
1. Access forms via Admin Dashboard > Intake Forms
2. Review new submissions
3. Mark as reviewed after reading
4. Search and filter as needed

## Technical Implementation

### Components
- `/components/intake/IntakeForm.tsx`: Main multi-step form
- `/components/intake/QuickUpdateForm.tsx`: Quick update form
- `/components/intake/ReturningClientForm.tsx`: Returning client wrapper
- `/components/intake/DigitalSignature.tsx`: Signature capture
- `/components/admin/IntakeFormManager.tsx`: Admin management

### Services
- `/lib/intake-forms/index.ts`: CRUD operations
- `/lib/email/intake-form-notifications.ts`: Email templates

### Types
- `/types/intake-forms.ts`: TypeScript definitions

## Future Enhancements

1. Custom form builder for practices
2. PDF export functionality
3. Integration with practice management systems
4. Automated follow-up forms
5. Multi-language support
6. HIPAA compliance features