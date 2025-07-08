import { NextRequest, NextResponse } from 'next/server'
import { sendBookingConfirmation } from '@/lib/notifications/email-service'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, email, confirmationNumber } = await request.json()

    if (!appointmentId || !email || !confirmationNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = await createClient(cookieStore)
    const serviceSupabase = createServiceClient()

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        service:services(*),
        client:profiles(*),
        intake_forms(id, completed_at)
      `)
      .eq('id', appointmentId)
      .single()

    if (appointmentError || !appointment) {
      console.error('Error fetching appointment:', appointmentError)
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      )
    }

    // Check if intake form exists and is completed
    const hasCompletedIntakeForm = appointment.intake_forms && 
      appointment.intake_forms.length > 0 && 
      appointment.intake_forms.some((form: any) => form.completed_at)
    
    // Prepare email data
    const therapistName = process.env.THERAPIST_NAME || 'Chanson Hanson'
    const businessName = process.env.BUSINESS_NAME || 'SOZA Massage Therapy'
    
    const emailData = {
      to: email,
      clientName: appointment.client?.first_name || 'Guest',
      appointmentDate: new Date(appointment.appointment_date),
      appointmentTime: `${appointment.start_time} - ${appointment.end_time}`,
      serviceName: appointment.service?.name || 'Service',
      duration: appointment.service?.duration_minutes || 60,
      therapistName,
      location: appointment.service?.is_consultation ? 'Online/Phone' : businessName,
      confirmationNumber,
      needsIntakeForm: !hasCompletedIntakeForm,
      intakeFormUrl: `${process.env.NEXT_PUBLIC_APP_URL}/intake-form?appointment=${appointmentId}`
    }

    // Check if we already sent a notification for this appointment (use service client to bypass RLS)
    const { data: existingNotification } = await serviceSupabase
      .from('notifications')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('type', 'booking_confirmation')
      .eq('status', 'sent')
      .single()
    
    if (existingNotification) {
      console.log('Notification already sent for appointment:', appointmentId)
      return NextResponse.json({ success: true, message: 'Notification already sent' })
    }
    
    // Create notification record (use service client to bypass RLS)
    const { data: notification, error: notificationError } = await serviceSupabase
      .from('notifications')
      .insert({
        recipient_id: appointment.client_id,
        recipient_email: email,
        type: 'booking_confirmation',
        channel: 'email',
        status: 'pending',
        scheduled_for: new Date().toISOString(),
        appointment_id: appointmentId,
        subject: `Booking Confirmation - ${confirmationNumber}`,
        content: JSON.stringify(emailData)
      })
      .select()
      .single()

    if (notificationError) {
      console.error('Error creating notification record:', notificationError)
    }

    // Send email
    try {
      const result = await sendBookingConfirmation(emailData)

      // Update notification status (use service client to bypass RLS)
      if (notification) {
        await serviceSupabase
          .from('notifications')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', notification.id)
      }

      return NextResponse.json({ success: true, result })
    } catch (error) {
      // Update notification status to failed (use service client to bypass RLS)
      if (notification) {
        await serviceSupabase
          .from('notifications')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error'
          })
          .eq('id', notification.id)
      }

      throw error
    }
  } catch (error) {
    console.error('Error sending booking confirmation:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send booking confirmation' },
      { status: 500 }
    )
  }
}