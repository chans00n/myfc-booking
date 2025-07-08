'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/contexts/BookingContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Calendar, Clock, MapPin, User, Mail, Phone, DollarSign, AlertCircle, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { createAppointment, generateConfirmationNumber, cancelAppointment } from '@/lib/appointments'
import { createClient } from '@/lib/supabase/client'

export function Confirmation() {
  const router = useRouter()
  const { user } = useAuth()
  const { bookingData, resetBooking, updateBookingData } = useBooking()
  const [appointmentDetails, setAppointmentDetails] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false)
  const [hasCreatedAppointment, setHasCreatedAppointment] = useState(false)
  const creationIdRef = useRef<string | null>(null)

  useEffect(() => {
    // If payment preference is not 'pay_now', create the appointment here
    if (bookingData.paymentPreference !== 'pay_now' && !bookingData.appointmentId && !loading && !isCreatingAppointment && !hasCreatedAppointment) {
      createAppointmentWithoutPayment()
    } else if (bookingData.appointmentId) {
      // Get appointment details from session storage for pay_now flow
      const storedAppointment = sessionStorage.getItem('lastAppointment')
      if (storedAppointment) {
        setAppointmentDetails(JSON.parse(storedAppointment))
        sessionStorage.removeItem('lastAppointment')
      }
    }
  }, [bookingData.paymentPreference, bookingData.appointmentId, loading, isCreatingAppointment, hasCreatedAppointment])

  const createAppointmentWithoutPayment = async () => {
    if (!bookingData.service || !bookingData.date || !bookingData.timeSlot || !bookingData.clientInfo) {
      setError('Missing booking information')
      return
    }

    // Generate a unique ID for this creation attempt
    const currentCreationId = Math.random().toString(36).substring(7)
    
    // Prevent duplicate creation
    if (creationIdRef.current) {
      console.log('Already creating appointment with ID:', creationIdRef.current)
      return
    }
    
    creationIdRef.current = currentCreationId
    console.log('Starting appointment creation with ID:', currentCreationId)

    setIsCreatingAppointment(true)
    setHasCreatedAppointment(true)
    setLoading(true)
    setError(null)

    try {
      const confirmationNumber = generateConfirmationNumber()
      
      // If this is a reschedule, cancel the old appointment first
      if (bookingData.rescheduleId) {
        console.log('Cancelling old appointment:', bookingData.rescheduleId)
        const { success: cancelSuccess, error: cancelError } = await cancelAppointment(bookingData.rescheduleId)
        
        if (!cancelSuccess) {
          console.error('Failed to cancel old appointment:', cancelError)
          // Continue with creating new appointment even if cancel fails
        }
      }
      
      // Create the appointment
      const { appointment, error: appointmentError } = await createAppointment({
        serviceId: bookingData.service.id,
        clientId: user?.id,
        appointmentDate: bookingData.date,
        startTime: format(bookingData.timeSlot.start, 'HH:mm:ss'),
        endTime: format(bookingData.timeSlot.end, 'HH:mm:ss'),
        totalPriceCents: bookingData.service.price_cents,
        paymentPreference: bookingData.paymentPreference,
        notes: '',
        guestEmail: bookingData.isGuest ? bookingData.clientInfo.email : undefined,
        guestFirstName: bookingData.isGuest ? bookingData.clientInfo.firstName : undefined,
        guestLastName: bookingData.isGuest ? bookingData.clientInfo.lastName : undefined,
        guestPhone: bookingData.isGuest ? bookingData.clientInfo.phone : undefined,
      })

      if (appointmentError || !appointment) {
        setError(appointmentError || 'Failed to create appointment')
        return
      }

      // Link intake form to appointment if one was created
      if (bookingData.intakeFormId && appointment.id) {
        const supabase = createClient()
        await supabase
          .from('intake_forms')
          .update({ appointment_id: appointment.id })
          .eq('id', bookingData.intakeFormId)
      }

      // Store appointment details
      const details = {
        appointmentId: appointment.id,
        confirmationNumber,
        service: bookingData.service,
        date: bookingData.date,
        timeSlot: bookingData.timeSlot,
        clientInfo: bookingData.clientInfo,
        paymentPreference: bookingData.paymentPreference
      }
      
      setAppointmentDetails(details)
      updateBookingData({ appointmentId: appointment.id })
      
      // Send confirmation email only once
      try {
        const emailResponse = await fetch('/api/notifications/booking-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            appointmentId: appointment.id,
            email: bookingData.clientInfo.email,
            confirmationNumber
          })
        })
        
        if (!emailResponse.ok) {
          console.error('Failed to send confirmation email:', await emailResponse.text())
        }
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError)
        // Don't fail the appointment creation if email fails
      }
    } catch (err) {
      setError('Failed to complete booking')
      console.error('Error creating appointment:', err)
      setIsCreatingAppointment(false)
    } finally {
      setLoading(false)
    }
  }

  const handleNewBooking = () => {
    resetBooking()
    router.push('/booking')
  }

  const handleViewAppointments = () => {
    router.push('/booking/my-appointments')
  }

  const handleCreateAccount = () => {
    // Store booking data for account creation
    sessionStorage.setItem('postBookingSignup', JSON.stringify(bookingData.clientInfo))
    router.push('/auth/signup')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Creating your appointment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-2">Booking Failed</p>
          <p className="text-gray-600 text-sm mb-4">{error}</p>
          <Button onClick={() => router.push('/booking')} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!bookingData.service || !bookingData.date || !bookingData.timeSlot || !appointmentDetails) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          No booking information found
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold mb-2">
          {bookingData.rescheduleId ? 'Appointment Rescheduled!' : 'Booking Confirmed!'}
        </h2>
        <p className="text-gray-600">
          {bookingData.rescheduleId 
            ? 'Your appointment has been successfully rescheduled' 
            : 'Your appointment has been successfully booked'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Confirmation Details</CardTitle>
          <CardDescription>
            Confirmation Number: <span className="font-mono font-semibold">{appointmentDetails.confirmationNumber}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-sm text-gray-600">
                  {format(bookingData.date, 'EEEE, MMMM d, yyyy')} at {format(bookingData.timeSlot.start, 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Service</p>
                <p className="text-sm text-gray-600">
                  {bookingData.service.name} ({bookingData.service.duration_minutes} minutes)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Location</p>
                <p className="text-sm text-gray-600">
                  123 Wellness Street, Relaxation City, RC 12345
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Client Information</p>
                <p className="text-sm text-gray-600">
                  {bookingData.clientInfo?.firstName} {bookingData.clientInfo?.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Payment</p>
                <p className="text-sm text-gray-600">
                  {bookingData.paymentPreference === 'pay_now' && 'Paid online'}
                  {bookingData.paymentPreference === 'pay_at_appointment' && 'Pay when you arrive'}
                  {bookingData.paymentPreference === 'pay_cash' && 'Pay cash at appointment'}
                  {' - '}${(bookingData.service.price_cents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Mail className="h-4 w-4" />
        <AlertDescription>
          A confirmation email has been sent to <strong>{bookingData.clientInfo?.email}</strong> with your booking details.
        </AlertDescription>
      </Alert>

      {bookingData.isGuest && !user && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Create an Account</CardTitle>
            <CardDescription>
              Save time on future bookings and manage your appointments easily
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateAccount} className="w-full">
              Create Account
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleNewBooking} variant="outline" className="flex-1">
          Book Another Appointment
        </Button>
        {user && (
          <Button onClick={handleViewAppointments} className="flex-1">
            View My Appointments
          </Button>
        )}
      </div>
    </div>
  )
}