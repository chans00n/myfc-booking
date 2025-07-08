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

interface ConsultationFollowupEmailProps {
  clientName: string
  consultationType: 'video' | 'phone'
  therapistName: string
  businessName: string
  bookingUrl: string
  specialOfferTitle?: string
  specialOfferDescription?: string
  specialOfferCode?: string
  logoUrl?: string
}

export const ConsultationFollowupEmail: React.FC<ConsultationFollowupEmailProps> = ({
  clientName,
  consultationType,
  therapistName,
  businessName,
  bookingUrl,
  specialOfferTitle,
  specialOfferDescription,
  specialOfferCode,
  logoUrl,
}) => {
  const previewText = `Thank you for your consultation - Special offer inside!`

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
          
          <Heading style={h1}>Thank You for Your Consultation!</Heading>
          
          <Text style={text}>Hi {clientName},</Text>
          
          <Text style={text}>
            Thank you for taking the time to speak with me during our {consultationType} consultation. 
            It was wonderful learning about your wellness goals and discussing how massage therapy can 
            support your journey to better health.
          </Text>

          <Text style={text}>
            Based on our conversation, I believe we can make real progress in addressing your concerns 
            and helping you feel your best.
          </Text>

          {specialOfferTitle && (
            <Section style={offerBox}>
              <Heading as="h2" style={offerHeading}>
                {specialOfferTitle}
              </Heading>
              
              <Text style={offerText}>
                {specialOfferDescription || 'As a thank you for your consultation, enjoy this exclusive offer on your first appointment!'}
              </Text>
              
              {specialOfferCode && (
                <Text style={offerCode}>
                  Use code: <strong>{specialOfferCode}</strong>
                </Text>
              )}
              
              <Button
                style={offerButton}
                href={bookingUrl}
              >
                Book Your First Appointment
              </Button>
              
              <Text style={offerFinePrint}>
                *Offer valid for 30 days from consultation date. Cannot be combined with other offers.
              </Text>
            </Section>
          )}

          <Section style={benefitsSection}>
            <Heading as="h2" style={h2}>
              What's Next?
            </Heading>
            
            <Text style={text}>
              Ready to start your wellness journey? Here's what you can expect:
            </Text>
            
            <ul style={list}>
              <li><strong>Personalized Treatment:</strong> Each session is tailored to your specific needs</li>
              <li><strong>Progress Tracking:</strong> We'll monitor your improvement over time</li>
              <li><strong>Flexible Scheduling:</strong> Book appointments that fit your schedule</li>
              <li><strong>Ongoing Support:</strong> I'm here to answer questions between sessions</li>
            </ul>
          </Section>

          <Section style={packagesSection}>
            <Heading as="h2" style={h2}>
              Popular Package Options
            </Heading>
            
            <Text style={text}>
              Many clients find these packages helpful for maintaining consistent progress:
            </Text>
            
            <div style={packageGrid}>
              <div style={packageCard}>
                <Text style={packageTitle}>Starter Package</Text>
                <Text style={packageDescription}>
                  3 sessions - Perfect for trying massage therapy
                </Text>
              </div>
              
              <div style={packageCard}>
                <Text style={packageTitle}>Wellness Package</Text>
                <Text style={packageDescription}>
                  6 sessions - Ideal for addressing specific concerns
                </Text>
              </div>
              
              <div style={packageCard}>
                <Text style={packageTitle}>Maintenance Package</Text>
                <Text style={packageDescription}>
                  Monthly sessions - Great for ongoing wellness
                </Text>
              </div>
            </div>
            
            <Text style={smallText}>
              Ask about package pricing when you book your first appointment!
            </Text>
          </Section>

          <Section style={ctaSection}>
            <Heading as="h2" style={h2}>
              Ready to Get Started?
            </Heading>
            
            <Text style={text}>
              Don't wait to start feeling better. Book your first appointment today and 
              take the first step toward improved health and wellness.
            </Text>
            
            <Button
              style={button}
              href={bookingUrl}
            >
              Book Your First Appointment
            </Button>
            
            <Text style={smallText}>
              Or reply to this email if you have any questions!
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={text}>
            I'm looking forward to working with you and supporting your wellness journey.
          </Text>

          <Text style={text}>
            With gratitude,
            <br />
            {therapistName}
            <br />
            {businessName}
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This email was sent to {clientName} following your recent consultation. 
            If you have any questions or concerns, please don't hesitate to reach out.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default ConsultationFollowupEmail

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

const offerBox = {
  backgroundColor: '#fff3cd',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '32px',
  border: '1px solid #ffeaa7',
}

const offerHeading = {
  color: '#856404',
  fontSize: '22px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '0 0 12px',
  textAlign: 'center' as const,
}

const offerText = {
  color: '#856404',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const offerCode = {
  backgroundColor: '#fff',
  borderRadius: '4px',
  padding: '12px',
  textAlign: 'center' as const,
  fontSize: '20px',
  margin: '16px 0',
  border: '2px dashed #856404',
}

const offerButton = {
  backgroundColor: '#ff6b6b',
  borderRadius: '8px',
  color: '#fff',
  display: 'block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '48px',
  padding: '0 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  margin: '16px auto',
  maxWidth: '300px',
}

const offerFinePrint = {
  color: '#856404',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  fontStyle: 'italic',
}

const benefitsSection = {
  marginBottom: '32px',
}

const packagesSection = {
  marginBottom: '32px',
}

const packageGrid = {
  marginBottom: '16px',
}

const packageCard = {
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  padding: '16px',
  marginBottom: '12px',
}

const packageTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#333',
  margin: '0 0 4px',
}

const packageDescription = {
  fontSize: '14px',
  color: '#666',
  margin: '0',
}

const ctaSection = {
  textAlign: 'center' as const,
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