'use client'

import { useEffect } from 'react'
import { useBooking } from '@/contexts/BookingContext'
import { useAuth } from '@/contexts/AuthContext'

export function IntakeFormDebugger() {
  const { user } = useAuth()
  const { bookingData } = useBooking()
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Intake Form Debug Info')
      console.log('Current User ID:', user?.id)
      console.log('Current User Email:', user?.email)
      console.log('Booking Data:', {
        intakeFormId: bookingData.intakeFormId,
        isGuest: bookingData.isGuest,
        isNewClient: bookingData.isNewClient,
        appointmentId: bookingData.appointmentId
      })
      console.log('Session Storage:', {
        lastAppointment: sessionStorage.getItem('lastAppointment'),
        postBookingSignup: sessionStorage.getItem('postBookingSignup')
      })
      console.log('Timestamp:', new Date().toISOString())
      console.groupEnd()
    }
  }, [user, bookingData])
  
  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/80 text-white text-xs rounded-lg max-w-sm z-50">
      <div className="font-bold mb-2">Intake Form Debug</div>
      <div>User: {user?.email || 'Not logged in'}</div>
      <div>Form ID: {bookingData.intakeFormId || 'None'}</div>
      <div>Step: {bookingData.appointmentId ? 'Has Appointment' : 'No Appointment'}</div>
    </div>
  )
}