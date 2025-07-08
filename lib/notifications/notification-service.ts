import { createClient } from '@/lib/supabase/client'
import { 
  sendBookingConfirmation, 
  sendAppointmentReminder, 
  sendCancellationConfirmation,
  formatAppointmentTime 
} from './email-service'
import { addHours, subHours, startOfDay, setHours, setMinutes } from 'date-fns'

export type NotificationType = 
  | 'booking_confirmation'
  | 'appointment_reminder_24h'
  | 'appointment_reminder_2h'
  | 'cancellation_confirmation'
  | 'rescheduling_notification'
  | 'intake_form_reminder'
  | 'follow_up'
  | 'therapist_new_booking'
  | 'therapist_cancellation'

export interface NotificationData {
  recipientId: string
  recipientEmail: string
  recipientPhone?: string
  type: NotificationType
  appointmentId: string
  scheduledFor: Date
  metadata?: Record<string, any>
}

export class NotificationService {
  private supabase

  constructor() {
    this.supabase = createClient()
  }

  async scheduleAppointmentNotifications(appointmentId: string) {
    try {
      // Fetch appointment details with related data
      const { data: appointment, error } = await this.supabase
        .from('appointments')
        .select(`
          *,
          client:profiles!appointments_client_id_fkey(*),
          service:services!appointments_service_id_fkey(*)
        `)
        .eq('id', appointmentId)
        .single()

      if (error || !appointment) {
        throw new Error('Appointment not found')
      }

      // Get user notification preferences
      const { data: preferences } = await this.supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', appointment.client_id)
        .single()

      const defaultPreferences = {
        email_enabled: true,
        booking_confirmation: true,
        appointment_reminder_24h: true,
        appointment_reminder_2h: true,
        reminder_time_24h: '09:00:00',
        reminder_time_2h: null,
      }

      const userPrefs = { ...defaultPreferences, ...preferences }

      if (!userPrefs.email_enabled) {
        return { success: true, message: 'Notifications disabled for user' }
      }

      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`)
      const notifications: NotificationData[] = []

      // Schedule booking confirmation (immediate)
      if (userPrefs.booking_confirmation) {
        notifications.push({
          recipientId: appointment.client_id,
          recipientEmail: appointment.client.email,
          recipientPhone: appointment.client.phone,
          type: 'booking_confirmation',
          appointmentId,
          scheduledFor: new Date(),
          metadata: {
            clientName: `${appointment.client.first_name} ${appointment.client.last_name}`,
            serviceName: appointment.service.name,
            duration: appointment.service.duration_minutes,
            appointmentTime: formatAppointmentTime(appointment.start_time, appointment.end_time),
            needsIntakeForm: !appointment.client.has_completed_intake,
          }
        })
      }

      // Schedule 24-hour reminder
      if (userPrefs.appointment_reminder_24h) {
        const reminder24h = subHours(appointmentDateTime, 24)
        
        // If custom time is set, use it
        if (userPrefs.reminder_time_24h) {
          const [hour, minute] = userPrefs.reminder_time_24h.split(':').map(Number)
          const customTime = setMinutes(setHours(startOfDay(reminder24h), hour), minute)
          
          // Only use custom time if it's still before the appointment
          if (customTime < appointmentDateTime) {
            notifications.push({
              recipientId: appointment.client_id,
              recipientEmail: appointment.client.email,
              recipientPhone: appointment.client.phone,
              type: 'appointment_reminder_24h',
              appointmentId,
              scheduledFor: customTime,
              metadata: {
                clientName: `${appointment.client.first_name} ${appointment.client.last_name}`,
                serviceName: appointment.service.name,
                duration: appointment.service.duration_minutes,
                appointmentTime: formatAppointmentTime(appointment.start_time, appointment.end_time),
                hasIntakeForm: appointment.client.has_completed_intake,
              }
            })
          }
        } else {
          notifications.push({
            recipientId: appointment.client_id,
            recipientEmail: appointment.client.email,
            recipientPhone: appointment.client.phone,
            type: 'appointment_reminder_24h',
            appointmentId,
            scheduledFor: reminder24h,
            metadata: {
              clientName: `${appointment.client.first_name} ${appointment.client.last_name}`,
              serviceName: appointment.service.name,
              duration: appointment.service.duration_minutes,
              appointmentTime: formatAppointmentTime(appointment.start_time, appointment.end_time),
              hasIntakeForm: appointment.client.has_completed_intake,
            }
          })
        }
      }

      // Schedule 2-hour reminder
      if (userPrefs.appointment_reminder_2h) {
        const reminder2h = subHours(appointmentDateTime, 2)
        
        notifications.push({
          recipientId: appointment.client_id,
          recipientEmail: appointment.client.email,
          recipientPhone: appointment.client.phone,
          type: 'appointment_reminder_2h',
          appointmentId,
          scheduledFor: reminder2h,
          metadata: {
            clientName: `${appointment.client.first_name} ${appointment.client.last_name}`,
            serviceName: appointment.service.name,
            duration: appointment.service.duration_minutes,
            appointmentTime: formatAppointmentTime(appointment.start_time, appointment.end_time),
            hasIntakeForm: appointment.client.has_completed_intake,
          }
        })
      }

      // Insert notifications into database
      const notificationRecords = notifications.map(notification => ({
        recipient_id: notification.recipientId,
        recipient_email: notification.recipientEmail,
        recipient_phone: notification.recipientPhone,
        type: notification.type,
        channel: 'email',
        appointment_id: notification.appointmentId,
        scheduled_for: notification.scheduledFor.toISOString(),
        subject: this.getEmailSubject(notification.type, notification.metadata),
        content: JSON.stringify(notification.metadata),
        metadata: notification.metadata,
      }))

      const { error: insertError } = await this.supabase
        .from('notifications')
        .insert(notificationRecords)

      if (insertError) {
        throw insertError
      }

      // Send immediate notifications
      for (const notification of notifications) {
        if (notification.type === 'booking_confirmation') {
          await this.sendNotification(notification)
        }
      }

      return { success: true, scheduled: notifications.length }
    } catch (error) {
      console.error('Error scheduling notifications:', error)
      throw error
    }
  }

  async sendNotification(notification: NotificationData) {
    try {
      const { type, metadata } = notification
      
      // Check if email service is configured
      if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== 'development') {
        console.warn('Email service not configured. Skipping notification.')
        return { success: false, error: 'Email service not configured' }
      }
      
      let result
      switch (type) {
        case 'booking_confirmation':
          result = await sendBookingConfirmation({
            to: notification.recipientEmail,
            clientName: metadata?.clientName,
            appointmentDate: new Date(metadata?.appointmentDate),
            appointmentTime: metadata?.appointmentTime,
            serviceName: metadata?.serviceName,
            duration: metadata?.duration,
            therapistName: metadata?.therapistName || 'Your Therapist',
            location: metadata?.location || 'Main Office',
            confirmationNumber: notification.appointmentId.slice(-8).toUpperCase(),
            needsIntakeForm: metadata?.needsIntakeForm,
            intakeFormUrl: `${process.env.NEXT_PUBLIC_APP_URL}/intake-form`,
          })
          break

        case 'appointment_reminder_24h':
        case 'appointment_reminder_2h':
          result = await sendAppointmentReminder({
            to: notification.recipientEmail,
            clientName: metadata?.clientName,
            appointmentDate: new Date(metadata?.appointmentDate),
            appointmentTime: metadata?.appointmentTime,
            serviceName: metadata?.serviceName,
            duration: metadata?.duration,
            therapistName: metadata?.therapistName || 'Your Therapist',
            location: metadata?.location || 'Main Office',
            reminderType: type === 'appointment_reminder_24h' ? '24h' : '2h',
            hasIntakeForm: metadata?.hasIntakeForm,
            intakeFormUrl: `${process.env.NEXT_PUBLIC_APP_URL}/intake-form`,
          })
          break

        case 'cancellation_confirmation':
          result = await sendCancellationConfirmation({
            to: notification.recipientEmail,
            clientName: metadata?.clientName,
            appointmentDate: new Date(metadata?.appointmentDate),
            appointmentTime: metadata?.appointmentTime,
            serviceName: metadata?.serviceName,
            cancellationReason: metadata?.reason,
            refundAmount: metadata?.refundAmount,
          })
          break

        default:
          throw new Error(`Unsupported notification type: ${type}`)
      }

      // Update notification status (only for real appointments)
      if (!notification.appointmentId.startsWith('test-')) {
        await this.supabase
          .from('notifications')
          .update({ 
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('appointment_id', notification.appointmentId)
          .eq('type', type)
      }

      return result
    } catch (error) {
      // Update notification status to failed (only for real appointments)
      if (!notification.appointmentId.startsWith('test-')) {
        await this.supabase
          .from('notifications')
          .update({ 
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            retry_count: notification.metadata?.retryCount || 0 + 1
          })
          .eq('appointment_id', notification.appointmentId)
          .eq('type', type)
      }

      throw error
    }
  }

  async cancelAppointmentNotifications(appointmentId: string) {
    try {
      // Cancel all pending notifications for this appointment
      const { error } = await this.supabase
        .from('notifications')
        .update({ status: 'cancelled' })
        .eq('appointment_id', appointmentId)
        .eq('status', 'pending')

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('Error cancelling notifications:', error)
      throw error
    }
  }

  private getEmailSubject(type: NotificationType, metadata?: Record<string, any>): string {
    switch (type) {
      case 'booking_confirmation':
        return `Appointment Confirmed - ${metadata?.serviceName}`
      case 'appointment_reminder_24h':
        return `Reminder: ${metadata?.serviceName} Appointment Tomorrow`
      case 'appointment_reminder_2h':
        return `Reminder: ${metadata?.serviceName} Appointment in 2 Hours`
      case 'cancellation_confirmation':
        return `Appointment Cancelled - ${metadata?.serviceName}`
      case 'rescheduling_notification':
        return `Appointment Rescheduled - ${metadata?.serviceName}`
      case 'intake_form_reminder':
        return 'Please Complete Your Intake Form'
      case 'follow_up':
        return 'Thank You for Your Visit'
      default:
        return 'Appointment Notification'
    }
  }
}