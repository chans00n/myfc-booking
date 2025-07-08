'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useBooking } from '@/contexts/BookingContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Calendar, Clock, Phone, Video, MapPin, Copy, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
// Removed Daily.co import - will use API route instead
import { createClient } from '@/lib/supabase/client'
import { createConsultationAppointment } from '@/lib/consultations'
import { toast } from 'sonner'

export function ConsultationConfirmation() {
  const router = useRouter()
  const { bookingData, resetBooking } = useBooking()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [consultationDetails, setConsultationDetails] = useState<any>(null)
  const [videoDetails, setVideoDetails] = useState<any>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    // Prevent duplicate calls in development (React StrictMode)
    let mounted = true
    
    if (bookingData.service && bookingData.date && bookingData.timeSlot && !consultationDetails) {
      if (mounted) {
        createConsultationBooking()
      }
    }
    
    return () => {
      mounted = false
    }
  }, [])

  const createConsultationBooking = async () => {
    // Prevent multiple simultaneous calls
    if (isCreating) return
    
    setIsCreating(true)
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      
      // For guest users, we need to create a profile first
      let clientId = user?.id;
      
      if (!clientId && bookingData.isGuest) {
        // Create a guest profile first
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            email: bookingData.clientInfo!.email,
            first_name: bookingData.clientInfo!.firstName,
            last_name: bookingData.clientInfo!.lastName,
            phone: bookingData.clientInfo!.phone,
            role: 'client'
          })
          .select()
          .single()
          
        if (profileError) {
          console.error('Error creating guest profile:', profileError)
          throw new Error('Failed to create guest profile: ' + profileError.message)
        }
        
        clientId = newProfile.id
      }
      
      if (!clientId) {
        throw new Error('No client ID available. Please log in or provide guest information.')
      }
      
      console.log('Creating consultation appointment with:', {
        clientId,
        date: bookingData.date,
        time: bookingData.timeSlot!.start,
        type: bookingData.consultationType,
        fullBookingData: bookingData
      })
      
      if (!bookingData.consultationType) {
        throw new Error('Consultation type is missing from booking data')
      }
      
      // Create the consultation appointment
      const { appointmentId, consultationId, appointment, consultation } = await createConsultationAppointment({
        clientId,
        appointmentDate: bookingData.date!,
        startTime: bookingData.timeSlot!.start,
        consultationType: bookingData.consultationType!,
        notes: `Consultation intake submitted. Primary concerns: ${bookingData.consultationIntake?.primaryConcerns}`,
        consultationIntake: bookingData.consultationIntake
      })

      setConsultationDetails({
        appointmentId,
        consultationId,
        ...consultation
      })

      // If video consultation, set up Daily.co room via API route
      if (bookingData.consultationType === 'video') {
        try {
          const response = await fetch('/api/consultations/create-room', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              consultationId,
              clientName: `${bookingData.clientInfo?.firstName} ${bookingData.clientInfo?.lastName}`,
              therapistName: 'Therapist'
            })
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to create video room')
          }

          const videoSetup = await response.json()
          setVideoDetails(videoSetup)
        } catch (videoError: any) {
          console.error('Failed to set up video room:', videoError)
          // Continue without video - the consultation is still booked
          toast.warning('Video room setup failed. You will receive alternative meeting instructions via email.')
        }
      }

      // Create intake form record
      if (bookingData.consultationIntake) {
        // First create the form, then update submitted_at to avoid constraint issues
        const { data: intakeForm, error: intakeError } = await supabase
          .from('intake_forms')
          .insert({
            client_id: clientId,
            appointment_id: appointmentId,
            form_category: 'consultation',
            status: 'completed',
            primary_concerns: bookingData.consultationIntake.primaryConcerns,
            massage_goals: bookingData.consultationIntake.massageGoals,
            previous_massage_therapy: bookingData.consultationIntake.previousMassageExperience,
            preferred_contact_method: bookingData.consultationType,
            best_time_to_call: bookingData.consultationIntake.bestTimeToCall
          })
          .select()
          .single()
          
        if (intakeError) {
          console.error('Error creating intake form:', intakeError)
          // Don't throw - the consultation is still booked
        } else if (intakeForm) {
          // Update submitted_at separately to ensure it's after created_at
          const { error: updateError } = await supabase
            .from('intake_forms')
            .update({ submitted_at: new Date().toISOString() })
            .eq('id', intakeForm.id)
            
          if (updateError) {
            console.error('Error updating intake form submission time:', updateError)
          }
        }
      }

    } catch (err: any) {
      console.error('Error creating consultation:', {
        error: err,
        message: err.message,
        details: err.details,
        code: err.code,
        bookingData: {
          service: bookingData.service,
          date: bookingData.date,
          timeSlot: bookingData.timeSlot,
          consultationType: bookingData.consultationType,
          clientInfo: bookingData.clientInfo
        }
      })
      setError(err.message || 'Failed to create consultation booking')
    } finally {
      setLoading(false)
      setIsCreating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!')
  }

  const getConsultationIcon = () => {
    switch (bookingData.consultationType) {
      case 'phone': return <Phone className="h-5 w-5" />
      case 'video': return <Video className="h-5 w-5" />
      case 'in_person': return <MapPin className="h-5 w-5" />
      default: return null
    }
  }

  const getConsultationInstructions = () => {
    switch (bookingData.consultationType) {
      case 'phone':
        return "We'll call you at the scheduled time on the phone number you provided."
      case 'video':
        return "Click the video link below at your appointment time to join the consultation."
      case 'in_person':
        return "Please arrive 5 minutes early to our clinic for your consultation."
      default:
        return ""
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Creating your consultation booking...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Consultation Booked!</h2>
        <p className="text-muted-foreground">
          Your free consultation has been successfully scheduled
        </p>
      </div>

      {/* Booking Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getConsultationIcon()}
            {bookingData.consultationType === 'phone' && 'Phone Consultation'}
            {bookingData.consultationType === 'video' && 'Video Consultation'}
            {bookingData.consultationType === 'in_person' && 'In-Person Consultation'}
          </CardTitle>
          <CardDescription>{getConsultationInstructions()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {bookingData.date && format(bookingData.date, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Time</p>
                <p className="font-medium">
                  {bookingData.timeSlot && format(bookingData.timeSlot.start, 'h:mm a')} (30 minutes)
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Video consultation details */}
          {bookingData.consultationType === 'video' && videoDetails && (
            <div className="space-y-3">
              <h4 className="font-medium">Video Meeting Details</h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Meeting Link</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-background px-2 py-1 rounded flex-1 truncate">
                      {videoDetails.roomUrl}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(videoDetails.roomUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(videoDetails.roomUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Alert>
                  <AlertDescription className="text-sm">
                    The video room will be available 5 minutes before your scheduled time. 
                    Make sure you have a stable internet connection and your camera/microphone are working.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          )}

          {/* Phone consultation details */}
          {bookingData.consultationType === 'phone' && (
            <div className="space-y-3">
              <h4 className="font-medium">Phone Call Details</h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm">
                  We'll call you at <strong>{bookingData.clientInfo?.phone}</strong> at the scheduled time.
                </p>
                {bookingData.consultationIntake?.bestTimeToCall && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Your preferred call time: {bookingData.consultationIntake.bestTimeToCall}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* In-person consultation details */}
          {bookingData.consultationType === 'in_person' && (
            <div className="space-y-3">
              <h4 className="font-medium">Location Details</h4>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium">SOZA Massage Therapy</p>
                <p className="text-sm text-muted-foreground">
                  123 Wellness Street<br />
                  Suite 100<br />
                  Your City, ST 12345
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.open('https://maps.google.com', '_blank')}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Get Directions
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* What to Expect */}
      <Card>
        <CardHeader>
          <CardTitle>What to Expect</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>We'll review your health concerns and goals</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Discuss potential treatment options</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Create a personalized massage therapy plan</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Answer any questions you may have</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={() => {
            resetBooking()
            router.push('/dashboard')
          }}
          className="flex-1"
        >
          Go to Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            resetBooking()
            router.push('/booking')
          }}
          className="flex-1"
        >
          Book Another Service
        </Button>
      </div>

      {/* Confirmation email notice */}
      <Alert>
        <AlertDescription>
          A confirmation email has been sent to <strong>{bookingData.clientInfo?.email}</strong> with 
          all the details of your consultation.
        </AlertDescription>
      </Alert>
    </div>
  )
}