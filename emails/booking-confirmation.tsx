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

interface BookingConfirmationEmailProps {
  clientName: string
  appointmentDate: string
  appointmentTime: string
  serviceName: string
  duration: number
  therapistName: string
  location: string
  confirmationNumber: string
  needsIntakeForm?: boolean
  intakeFormUrl?: string
  paymentPreference?: 'pay_now' | 'pay_at_appointment' | 'pay_cash'
  paymentAmount?: number
  isPaid?: boolean
}

export const BookingConfirmationEmail = ({
  clientName,
  appointmentDate,
  appointmentTime,
  serviceName,
  duration,
  therapistName,
  location,
  confirmationNumber,
  needsIntakeForm = false,
  intakeFormUrl,
  paymentPreference = 'pay_at_appointment',
  paymentAmount = 0,
  isPaid = false,
}: BookingConfirmationEmailProps) => {
  const previewText = `Your ${serviceName} appointment is confirmed for ${appointmentDate}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Appointment Confirmed!</Heading>
          
          <Text style={text}>Hi {clientName},</Text>
          
          <Text style={text}>
            Your appointment has been successfully booked. We look forward to seeing you!
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
            
            <Text style={detailRow}>
              <strong>Confirmation #:</strong> {confirmationNumber}
            </Text>
          </Section>

          {/* Payment Information */}
          <Section style={paymentSection}>
            <Heading as="h2" style={h2}>Payment Information</Heading>
            
            {isPaid ? (
              <Text style={text}>
                <strong>✓ Payment Received:</strong> ${(paymentAmount / 100).toFixed(2)}
                <br />
                Your payment has been processed successfully.
              </Text>
            ) : (
              <>
                <Text style={text}>
                  <strong>Amount Due:</strong> ${(paymentAmount / 100).toFixed(2)}
                </Text>
                
                {paymentPreference === 'pay_at_appointment' && (
                  <Text style={text}>
                    Payment will be collected when you arrive for your appointment. 
                    We accept cash, credit card, or check.
                  </Text>
                )}
                
                {paymentPreference === 'pay_cash' && (
                  <Text style={text}>
                    Please bring ${(paymentAmount / 100).toFixed(2)} in cash to your appointment. 
                    We appreciate exact change when possible.
                  </Text>
                )}
              </>
            )}
          </Section>

          {needsIntakeForm && (
            <Section style={ctaSection}>
              <Heading as="h2" style={h2}>Action Required</Heading>
              <Text style={text}>
                Please complete your intake form before your appointment:
              </Text>
              <Button style={button} href={intakeFormUrl}>
                Complete Intake Form
              </Button>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={footer}>
            Need to change your appointment? Visit your{' '}
            <Link style={link} href={`${process.env.NEXT_PUBLIC_APP_URL}/bookings`}>
              booking portal
            </Link>{' '}
            or contact us directly.
          </Text>

          <Text style={footer}>
            We'll send you a reminder 24 hours before your appointment.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default BookingConfirmationEmail

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

const paymentSection = {
  backgroundColor: '#f0f9ff',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  border: '1px solid #e0f2fe',
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