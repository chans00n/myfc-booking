import type { IntakeForm } from '@/types/intake-forms'

interface EmailNotification {
  to: string
  subject: string
  body: string
  templateId?: string
  data?: Record<string, any>
}

/**
 * Email notification service for intake forms
 * In a production environment, these functions would call a backend API
 * that handles actual email sending via services like SendGrid, Postmark, etc.
 */

export async function sendIntakeFormSubmittedNotification(
  form: IntakeForm,
  clientEmail: string,
  clientName: string
): Promise<{ success: boolean; error?: string }> {
  const notification: EmailNotification = {
    to: clientEmail,
    subject: 'Intake Form Received - Thank You',
    templateId: 'intake-form-submitted',
    body: `Dear ${clientName},\n\nThank you for completing your intake form. We have received your information and will review it before your appointment.\n\nIf you need to make any changes, please contact us.\n\nBest regards,\nSOZA Massage Therapy`,
    data: {
      clientName,
      formType: form.form_type,
      submittedDate: new Date(form.submitted_at || '').toLocaleDateString()
    }
  }

  // In production, this would make an API call to send the email
  console.log('Email notification (not sent in development):', notification)
  
  return { success: true }
}

export async function sendIntakeFormReminderNotification(
  clientEmail: string,
  clientName: string,
  appointmentDate: Date,
  formLink: string
): Promise<{ success: boolean; error?: string }> {
  const notification: EmailNotification = {
    to: clientEmail,
    subject: 'Reminder: Please Complete Your Intake Form',
    templateId: 'intake-form-reminder',
    body: `Dear ${clientName},\n\nYour appointment is scheduled for ${appointmentDate.toLocaleDateString()}. Please complete your intake form before your visit.\n\nClick here to complete your form: ${formLink}\n\nThank you,\nSOZA Massage Therapy`,
    data: {
      clientName,
      appointmentDate: appointmentDate.toLocaleDateString(),
      formLink
    }
  }

  // In production, this would make an API call to send the email
  console.log('Email notification (not sent in development):', notification)
  
  return { success: true }
}

export async function sendIntakeFormToTherapist(
  form: IntakeForm,
  therapistEmail: string,
  clientName: string,
  appointmentDate: Date
): Promise<{ success: boolean; error?: string }> {
  const notification: EmailNotification = {
    to: therapistEmail,
    subject: `New Intake Form - ${clientName}`,
    templateId: 'intake-form-therapist',
    body: `A new intake form has been submitted.\n\nClient: ${clientName}\nAppointment: ${appointmentDate.toLocaleDateString()}\nForm Type: ${form.form_type}\n\nPlease review the form in the admin dashboard before the appointment.`,
    data: {
      clientName,
      appointmentDate: appointmentDate.toLocaleDateString(),
      formType: form.form_type,
      formId: form.id,
      dashboardLink: `/dashboard/intake-forms?form=${form.id}`
    }
  }

  // In production, this would make an API call to send the email
  console.log('Email notification (not sent in development):', notification)
  
  return { success: true }
}

export async function sendQuickUpdateNotification(
  form: IntakeForm,
  therapistEmail: string,
  clientName: string
): Promise<{ success: boolean; error?: string }> {
  const notification: EmailNotification = {
    to: therapistEmail,
    subject: `Health Update - ${clientName}`,
    templateId: 'quick-update-notification',
    body: `${clientName} has submitted a quick health update.\n\nPlease review the updates in the admin dashboard before their appointment.`,
    data: {
      clientName,
      formId: form.id,
      updateDate: new Date().toLocaleDateString(),
      dashboardLink: `/dashboard/intake-forms?form=${form.id}`
    }
  }

  // In production, this would make an API call to send the email
  console.log('Email notification (not sent in development):', notification)
  
  return { success: true }
}

/**
 * Integration point for email service
 * This function would be called by the backend API
 */
export async function sendEmail(notification: EmailNotification): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, integrate with email service provider
    // Example with SendGrid:
    // const response = await sgMail.send({
    //   to: notification.to,
    //   from: process.env.FROM_EMAIL,
    //   subject: notification.subject,
    //   text: notification.body,
    //   templateId: notification.templateId,
    //   dynamicTemplateData: notification.data
    // })
    
    console.log('Email would be sent:', notification)
    return { success: true }
  } catch (error) {
    console.error('Email sending error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    }
  }
}