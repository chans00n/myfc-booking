# Consultation Room Setup Guide

## Overview

The SOZA Massage consultation room provides a secure, HIPAA-compliant video consultation platform powered by Daily.co. This guide covers the setup, configuration, and usage of the consultation room feature.

## Features

- **Video & Phone Consultations**: Support for both video calls and phone consultations
- **Waiting Room**: Pre-call waiting area with appointment details and preparation checklist
- **Real-time Timer**: Tracks consultation duration with warnings for time limits
- **Admin Tools**: 
  - Live note-taking with auto-save
  - Client information panel with intake form details
  - Health history and medication information
- **Mobile Responsive**: Fully optimized for mobile devices
- **Security**: Token-based access control with role-based permissions

## Technical Setup

### Prerequisites

1. Daily.co account with API access
2. Environment variables configured:
   ```env
   DAILY_API_KEY=your_daily_api_key
   NEXT_PUBLIC_DAILY_DOMAIN=your-domain.daily.co
   NEXT_PUBLIC_APP_URL=https://your-app-url.com
   ```

### Database Schema

The consultation feature requires the following database tables:
- `consultations`: Stores consultation records
- `appointments`: Links consultations to scheduled appointments
- `intake_forms`: Contains client health information

### API Routes

- `POST /api/consultations/create-room`: Creates a new Daily.co room
- `PATCH /api/consultations/[id]/status`: Updates consultation status
- `POST /api/daily/join-hook`: Webhook for Daily.co events

## Usage Guide

### Client Flow

1. **Booking**: Client books a consultation through the booking wizard
2. **Confirmation**: Receives appointment details and consultation link
3. **Waiting Room**: Joins 5 minutes before scheduled time
4. **Consultation**: Engages in video/phone call with therapist
5. **Completion**: Consultation ends, appointment marked complete

### Admin/Therapist Flow

1. **Dashboard**: View scheduled consultations
2. **Join Room**: Access consultation with admin privileges
3. **Client Info**: Review intake form and health history
4. **Note Taking**: Document consultation in real-time
5. **Follow-up**: Schedule additional appointments if needed

## Security Considerations

### Access Control

- Consultation rooms are private and require authentication
- Tokens are generated per-participant with specific permissions
- Rooms expire 30 minutes after scheduled time
- Recording is disabled for privacy compliance

### Data Protection

- All consultation data is encrypted in transit
- Notes are stored securely in the database
- Client health information is access-controlled
- No video recordings are stored

## Mobile Optimization

### Responsive Design

- Adaptive layouts for different screen sizes
- Touch-optimized controls
- Mobile-specific UI patterns (drawers, sheets)
- Reduced data usage for cellular connections

### Performance

- Lazy loading of components
- Optimized video quality based on connection
- Minimal UI for better video performance
- Auto-reconnection on network changes

## Customization

### Branding

The consultation room can be customized with:
- Custom logo and colors
- Branded waiting room
- Themed UI components
- Custom email templates

### Configuration Options

```typescript
// consultation-config.ts
export const consultationConfig = {
  maxDuration: 30, // minutes
  earlyJoinWindow: 5, // minutes before start
  lateJoinWindow: 15, // minutes after start
  enableChat: true,
  enableScreenShare: true,
  maxParticipants: 2
}
```

## Troubleshooting

### Common Issues

1. **Cannot create room**: Check Daily.co API key configuration
2. **Video not working**: Ensure camera permissions are granted
3. **Poor connection**: Recommend ethernet or strong WiFi
4. **Audio echo**: Use headphones or adjust microphone settings

### Debug Mode

Enable debug logging:
```typescript
// In development
process.env.CONSULTATION_DEBUG = 'true'
```

## Integration Points

### Intake Forms

Consultation rooms automatically load relevant intake form data:
- Health conditions
- Medications
- Allergies
- Treatment goals

### Appointment System

Consultations are fully integrated with the appointment system:
- Automatic status updates
- Calendar synchronization
- Payment processing (for paid consultations)
- Email notifications

### Analytics

Track consultation metrics:
- Average duration
- Completion rates
- Technical issues
- Client satisfaction

## Best Practices

### For Therapists

1. Test equipment before consultations
2. Ensure quiet, professional environment
3. Have backup contact method ready
4. Document thoroughly during consultation
5. Follow up within 24 hours

### For Development

1. Test on multiple devices and browsers
2. Monitor Daily.co usage and limits
3. Implement proper error handling
4. Regular security audits
5. Keep dependencies updated

## Future Enhancements

- AI-powered transcription
- Multi-party consultations
- Screen annotation tools
- Integrated scheduling within room
- Post-consultation surveys