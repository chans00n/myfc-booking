import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface ConsultationConfirmationEmailProps {
  clientName: string
  consultationType: 'video' | 'phone'
  consultationDate: string
  consultationTime: string
  duration: number
  roomUrl?: string
  phoneNumber?: string
  therapistName: string
  businessName: string
  logoUrl?: string
}

export const ConsultationConfirmationEmail: React.FC<ConsultationConfirmationEmailProps> = ({
  clientName,
  consultationType,
  consultationDate,
  consultationTime,
  duration,
  roomUrl,
  phoneNumber,
  therapistName,
  businessName,
  logoUrl,
}) => {
  const previewText = `Your free ${consultationType} consultation is confirmed for ${consultationDate}`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && (
            <Img
              src={logoUrl}
              width="150"
              height="50"
              alt={businessName}
              style={logo}
            />
          )}
          
          <Heading style={h1}>Your Free Consultation is Confirmed!</Heading>
          
          <Text style={text}>Hi {clientName},</Text>
          
          <Text style={text}>
            Thank you for scheduling your free {consultationType} consultation with {therapistName}. 
            We're looking forward to learning about your wellness goals and how we can help you achieve them.
          </Text>

          <Section style={appointmentBox}>
            <Heading as="h2" style={h2}>
              Consultation Details
            </Heading>
            
            <Text style={appointmentDetail}>
              <strong>Type:</strong> {consultationType === 'video' ? 'Video Consultation' : 'Phone Consultation'}
            </Text>
            <Text style={appointmentDetail}>
              <strong>Date:</strong> {consultationDate}
            </Text>
            <Text style={appointmentDetail}>
              <strong>Time:</strong> {consultationTime}
            </Text>
            <Text style={appointmentDetail}>
              <strong>Duration:</strong> {duration} minutes
            </Text>
          </Section>

          {consultationType === 'video' && roomUrl && (
            <Section style={joinSection}>
              <Heading as="h2" style={h2}>
                How to Join Your Video Consultation
              </Heading>
              
              <Text style={text}>
                On the day of your consultation, simply click the button below to join the video call. 
                No download or account required!
              </Text>
              
              <Button
                style={button}
                href={roomUrl}
              >
                Join Video Consultation
              </Button>
              
              <Text style={smallText}>
                Video link: <Link href={roomUrl} style={link}>{roomUrl}</Link>
              </Text>
              
              <Text style={text}>
                <strong>Tips for your video consultation:</strong>
              </Text>
              <ul style={list}>
                <li>Find a quiet, private space</li>
                <li>Test your camera and microphone beforehand</li>
                <li>Have a stable internet connection</li>
                <li>Join 2-3 minutes early</li>
              </ul>
            </Section>
          )}

          {consultationType === 'phone' && phoneNumber && (
            <Section style={joinSection}>
              <Heading as="h2" style={h2}>
                How to Join Your Phone Consultation
              </Heading>
              
              <Text style={text}>
                We'll call you at your scheduled time. Please ensure your phone is available.
              </Text>
              
              <Text style={appointmentDetail}>
                <strong>We'll call you at:</strong> {phoneNumber}
              </Text>
              
              <Text style={smallText}>
                If you need to update your phone number, please contact us as soon as possible.
              </Text>
            </Section>
          )}

          <Section style={prepareSection}>
            <Heading as="h2" style={h2}>
              What to Prepare
            </Heading>
            
            <Text style={text}>
              To make the most of your consultation, please think about:
            </Text>
            
            <ul style={list}>
              <li>Your current health concerns or pain points</li>
              <li>Any injuries or medical conditions</li>
              <li>Your wellness goals</li>
              <li>Questions you'd like to ask about massage therapy</li>
              <li>Your schedule and availability for regular appointments</li>
            </ul>
          </Section>

          <Section style={expectSection}>
            <Heading as="h2" style={h2}>
              What to Expect
            </Heading>
            
            <Text style={text}>
              During your {duration}-minute consultation, we'll:
            </Text>
            
            <ul style={list}>
              <li>Discuss your health history and current concerns</li>
              <li>Talk about how massage therapy can help you</li>
              <li>Answer any questions you have</li>
              <li>Recommend a treatment plan tailored to your needs</li>
              <li>Discuss scheduling and pricing options</li>
            </ul>
            
            <Text style={text}>
              This is a no-pressure conversation focused on understanding your needs and determining 
              if we're the right fit for your wellness journey.
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            Need to reschedule or cancel? No problem! Just reply to this email or contact us at least 
            2 hours before your scheduled time.
          </Text>

          <Text style={text}>
            Looking forward to speaking with you!
          </Text>

          <Text style={text}>
            Best regards,
            <br />
            {therapistName}
            <br />
            {businessName}
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This email was sent to {clientName}. If you have any questions, please don't hesitate to contact us.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ConsultationConfirmationEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const logo = {
  margin: '0 auto 32px',
  display: 'block',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 16px',
}

const text = {
  color: '#555',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const smallText = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const appointmentBox = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
}

const appointmentDetail = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
}

const joinSection = {
  marginBottom: '32px',
}

const prepareSection = {
  marginBottom: '32px',
}

const expectSection = {
  marginBottom: '32px',
}

const button = {
  backgroundColor: '#000',
  borderRadius: '8px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '48px',
  padding: '0 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  margin: '16px 0',
}

const link = {
  color: '#0066cc',
  textDecoration: 'underline',
}

const list = {
  marginLeft: '20px',
  marginBottom: '16px',
  color: '#555',
}

const hr = {
  borderColor: '#e8eaed',
  margin: '32px 0',
}

const footer = {
  color: '#999',
  fontSize: '14px',
  lineHeight: '20px',
  textAlign: 'center' as const,
}