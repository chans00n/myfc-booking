import { Resend } from 'resend'
import { BookingConfirmationEmail } from '@/emails/booking-confirmation'
import { AppointmentReminderEmail } from '@/emails/appointment-reminder'
import { CancellationConfirmationEmail } from '@/emails/cancellation-confirmation'
import { ConsultationConfirmationEmail } from '@/emails/consultation-confirmation'
import { ConsultationReminderEmail } from '@/emails/consultation-reminder'
import { ConsultationFollowupEmail } from '@/emails/consultation-followup'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

// Lazy initialization of Resend
let resend: Resend | null = null

function getResendClient(): Resend | null {
  if (!resend && process.env.RESEND_API_KEY) {
    console.log('🔑 Initializing Resend with API key:', process.env.RESEND_API_KEY.substring(0, 7) + '...')
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export interface EmailData {
  to: string
  subject: string
  react?: React.ReactElement
  text?: string
}

export async function sendEmail({ to, subject, react, text }: EmailData) {
  try {
    const resendClient = getResendClient()
    
    // In development without API key, just log the email
    if (!resendClient) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email (Development Mode):')
        console.log('To:', to)
        console.log('Subject:', subject)
        console.log('Content:', text || 'React Email Template')
        return { success: true, data: { id: 'dev-' + Date.now() } }
      } else {
        throw new Error('Email service not configured. Please add RESEND_API_KEY to your environment variables.')
      }
    }

    // Send real email with Resend
    console.log('📤 Sending email via Resend to:', to)
    const { data, error } = await resendClient.emails.send({
      from: process.env.SMTP_FROM || 'noreply@yourdomain.com',
      to,
      subject,
      react,
      text,
    })

    if (error) {
      console.error('Email send error:', error)
      throw error
    }

    console.log('✅ Email sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

export async function sendBookingConfirmation({
  to,
  clientName,
  appointmentDate,
  appointmentTime,
  serviceName,
  duration,
  therapistName,
  location,
  confirmationNumber,
  needsIntakeForm,
  intakeFormUrl,
}: {
  to: string
  clientName: string
  appointmentDate: Date
  appointmentTime: string
  serviceName: string
  duration: number
  therapistName: string
  location: string
  confirmationNumber: string
  needsIntakeForm?: boolean
  intakeFormUrl?: string
}) {
  const formattedDate = format(appointmentDate, 'EEEE, MMMM d, yyyy')
  
  return sendEmail({
    to,
    subject: `Appointment Confirmed - ${serviceName} on ${format(appointmentDate, 'MMM d')}`,
    react: BookingConfirmationEmail({
      clientName,
      appointmentDate: formattedDate,
      appointmentTime,
      serviceName,
      duration,
      therapistName,
      location,
      confirmationNumber,
      needsIntakeForm,
      intakeFormUrl,
    }),
  })
}

export async function sendAppointmentReminder({
  to,
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
}: {
  to: string
  clientName: string
  appointmentDate: Date
  appointmentTime: string
  serviceName: string
  duration: number
  therapistName: string
  location: string
  reminderType: '24h' | '2h'
  hasIntakeForm: boolean
  intakeFormUrl?: string
}) {
  const formattedDate = format(appointmentDate, 'EEEE, MMMM d, yyyy')
  const subjectTime = reminderType === '24h' ? 'Tomorrow' : 'Today'
  
  return sendEmail({
    to,
    subject: `Reminder: ${serviceName} Appointment ${subjectTime}`,
    react: AppointmentReminderEmail({
      clientName,
      appointmentDate: formattedDate,
      appointmentTime,
      serviceName,
      duration,
      therapistName,
      location,
      reminderType,
      hasIntakeForm,
      intakeFormUrl,
    }),
  })
}

export async function sendCancellationConfirmation({
  to,
  clientName,
  appointmentDate,
  appointmentTime,
  serviceName,
  cancellationReason,
  refundAmount,
}: {
  to: string
  clientName: string
  appointmentDate: Date
  appointmentTime: string
  serviceName: string
  cancellationReason?: string
  refundAmount?: number
}) {
  const formattedDate = format(appointmentDate, 'EEEE, MMMM d, yyyy')
  
  return sendEmail({
    to,
    subject: `Appointment Cancelled - ${serviceName}`,
    react: CancellationConfirmationEmail({
      clientName,
      appointmentDate: formattedDate,
      appointmentTime,
      serviceName,
      cancellationReason,
      refundAmount,
    }),
  })
}

// Consultation-specific email functions
export async function sendConsultationConfirmation({
  to,
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
}: {
  to: string
  clientName: string
  consultationType: 'video' | 'phone'
  consultationDate: Date
  consultationTime: string
  duration: number
  roomUrl?: string
  phoneNumber?: string
  therapistName: string
  businessName: string
  logoUrl?: string
}) {
  const formattedDate = format(consultationDate, 'EEEE, MMMM d, yyyy')
  
  return sendEmail({
    to,
    subject: `Your Free Consultation is Confirmed - ${format(consultationDate, 'MMM d')}`,
    react: ConsultationConfirmationEmail({
      clientName,
      consultationType,
      consultationDate: formattedDate,
      consultationTime,
      duration,
      roomUrl,
      phoneNumber,
      therapistName,
      businessName,
      logoUrl,
    }),
  })
}

export async function sendConsultationReminder({
  to,
  clientName,
  consultationType,
  consultationDate,
  consultationTime,
  duration,
  reminderType,
  roomUrl,
  phoneNumber,
  therapistName,
  businessName,
  logoUrl,
}: {
  to: string
  clientName: string
  consultationType: 'video' | 'phone'
  consultationDate: Date
  consultationTime: string
  duration: number
  reminderType: '24hour' | '1hour' | '15min'
  roomUrl?: string
  phoneNumber?: string
  therapistName: string
  businessName: string
  logoUrl?: string
}) {
  const formattedDate = format(consultationDate, 'EEEE, MMMM d, yyyy')
  
  let subject = ''
  switch (reminderType) {
    case '24hour':
      subject = 'Your consultation is tomorrow'
      break
    case '1hour':
      subject = 'Your consultation starts in 1 hour'
      break
    case '15min':
      subject = 'URGENT: Your consultation starts in 15 minutes'
      break
  }
  
  return sendEmail({
    to,
    subject,
    react: ConsultationReminderEmail({
      clientName,
      consultationType,
      consultationDate: formattedDate,
      consultationTime,
      duration,
      reminderType,
      roomUrl,
      phoneNumber,
      therapistName,
      businessName,
      logoUrl,
    }),
  })
}

export async function sendConsultationFollowup({
  to,
  clientName,
  consultationType,
  therapistName,
  businessName,
  bookingUrl,
  specialOfferTitle,
  specialOfferDescription,
  specialOfferCode,
  logoUrl,
}: {
  to: string
  clientName: string
  consultationType: 'video' | 'phone'
  therapistName: string
  businessName: string
  bookingUrl: string
  specialOfferTitle?: string
  specialOfferDescription?: string
  specialOfferCode?: string
  logoUrl?: string
}) {
  return sendEmail({
    to,
    subject: 'Thank you for your consultation - Special offer inside!',
    react: ConsultationFollowupEmail({
      clientName,
      consultationType,
      therapistName,
      businessName,
      bookingUrl,
      specialOfferTitle,
      specialOfferDescription,
      specialOfferCode,
      logoUrl,
    }),
  })
}

// Helper function to format time for display
export function formatAppointmentTime(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':').map(Number)
    const date = new Date()
    date.setHours(hour, minute)
    return format(date, 'h:mm a')
  }
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`
}