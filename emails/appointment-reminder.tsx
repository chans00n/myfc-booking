import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface AppointmentReminderEmailProps {
  clientName: string
  appointmentDate: string
  appointmentTime: string
  serviceName: string
  duration: number
  therapistName: string
  location: string
  reminderType: '24h' | '2h'
  hasIntakeForm: boolean
  intakeFormUrl?: string
  paymentPreference?: 'pay_now' | 'pay_at_appointment' | 'pay_cash'
  paymentAmount?: number
  isPaid?: boolean
}

export const AppointmentReminderEmail = ({
  clientName,
  appointmentDate,
  appointmentTime,
  serviceName,
  duration,
  therapistName,
  location,
  reminderType,
  hasIntakeForm,
  intakeFormUrl,
  paymentPreference = 'pay_at_appointment',
  paymentAmount = 0,
  isPaid = false,
}: AppointmentReminderEmailProps) => {
  const timeText = reminderType === '24h' ? 'tomorrow' : 'in 2 hours'
  const previewText = `Reminder: Your ${serviceName} appointment is ${timeText}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>
            {reminderType === '24h' ? 'Appointment Tomorrow' : 'Appointment Soon'}
          </Heading>
          
          <Text style={text}>Hi {clientName},</Text>
          
          <Text style={text}>
            This is a friendly reminder that your {serviceName} appointment is {timeText}.
          </Text>

          <Section style={appointmentDetails}>
            <Heading as="h2" style={h2}>Appointment Details</Heading>
            
            <Text style={detailRow}>
              <strong>Service:</strong> {serviceName}
            </Text>
            
            <Text style={detailRow}>
              <strong>Date:</strong> {appointmentDate}
            </Text>
            
            <Text style={detailRow}>
              <strong>Time:</strong> {appointmentTime}
            </Text>
            
            <Text style={detailRow}>
              <strong>Duration:</strong> {duration} minutes
            </Text>
            
            <Text style={detailRow}>
              <strong>Therapist:</strong> {therapistName}
            </Text>
            
            <Text style={detailRow}>
              <strong>Location:</strong> {location}
            </Text>
          </Section>

          {!hasIntakeForm && reminderType === '24h' && (
            <Section style={ctaSection}>
              <Heading as="h2" style={h2}>Don't Forget!</Heading>
              <Text style={text}>
                Please complete your intake form before your appointment:
              </Text>
              <Button style={button} href={intakeFormUrl}>
                Complete Intake Form
              </Button>
            </Section>
          )}

          <Section>
            <Heading as="h2" style={h2}>Prepare for Your Visit</Heading>
            <Text style={text}>
              • Arrive 5-10 minutes early to settle in
            </Text>
            <Text style={text}>
              • Wear comfortable, loose-fitting clothing
            </Text>
            <Text style={text}>
              • Stay hydrated before and after your massage
            </Text>
            <Text style={text}>
              • Let us know if you have any questions or concerns
            </Text>
            {!isPaid && paymentAmount > 0 && (
              <>
                {paymentPreference === 'pay_at_appointment' && (
                  <Text style={text}>
                    • Payment of ${(paymentAmount / 100).toFixed(2)} will be collected at your appointment
                  </Text>
                )}
                {paymentPreference === 'pay_cash' && (
                  <Text style={text}>
                    • Please bring ${(paymentAmount / 100).toFixed(2)} in cash (exact change appreciated)
                  </Text>
                )}
              </>
            )}
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Need to reschedule? Visit your{' '}
            <Link style={link} href={`${process.env.NEXT_PUBLIC_APP_URL}/bookings`}>
              booking portal
            </Link>{' '}
            or contact us as soon as possible.
          </Text>

          <Text style={footer}>
            We look forward to seeing you {timeText}!
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default AppointmentReminderEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 20px',
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const appointmentDetails = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
}

const detailRow = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 8px',
}

const ctaSection = {
  margin: '32px 0',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#000',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '42px 0 26px',
}

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
}

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 8px',
}