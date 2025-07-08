'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getAppointmentsByClient, cancelAppointment } from '@/lib/appointments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { format, isPast, isFuture, parseISO } from 'date-fns'
import { Calendar, Clock, MapPin, DollarSign, Loader2, AlertCircle, Video } from 'lucide-react'
import type { Appointment } from '@/types'
import { PageContainer, PageHeader } from '@/components/layout/PageContainer'

export default function MyAppointmentsPage() {
  const router = useRouter()
  const { user, profile, loading: authLoading } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      loadAppointments()
    }
  }, [profile])

  const loadAppointments = async () => {
    if (!profile) return
    
    setLoading(true)
    const data = await getAppointmentsByClient(profile.id)
    setAppointments(data)
    setLoading(false)
  }

  const handleCancelClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowCancelDialog(true)
  }
  
  const handleReschedule = (appointment: Appointment) => {
    // Navigate to booking page with service pre-selected
    router.push(`/booking?service=${appointment.service.id}&reschedule=${appointment.id}`)
  }

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return
    
    setCancellingId(selectedAppointment.id)
    const result = await cancelAppointment(selectedAppointment.id)
    
    if (result.success) {
      toast({
        title: 'Appointment Cancelled',
        description: 'Your appointment has been cancelled successfully.',
      })
      loadAppointments()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to cancel appointment',
        variant: 'destructive',
      })
    }
    
    setCancellingId(null)
    setShowCancelDialog(false)
    setSelectedAppointment(null)
  }

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    )
  }

  if (!user || !profile) {
    return (
      <PageContainer>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please sign in to view your appointments.
          </AlertDescription>
        </Alert>
      </PageContainer>
    )
  }

  const upcomingAppointments = appointments.filter(apt => {
    const aptDate = parseISO(`${apt.appointment_date}T${apt.start_time}`)
    return isFuture(aptDate) && apt.status !== 'cancelled'
  })

  const pastAppointments = appointments.filter(apt => {
    const aptDate = parseISO(`${apt.appointment_date}T${apt.start_time}`)
    return isPast(aptDate) || apt.status === 'cancelled'
  })

  const getStatusBadge = (appointment: Appointment) => {
    const statusStyles = {
      scheduled: 'default',
      confirmed: 'secondary',
      completed: 'outline',
      cancelled: 'destructive',
      no_show: 'destructive',
    }

    return (
      <Badge variant={statusStyles[appointment.status] as any || 'default'}>
        {appointment.status.replace('_', ' ')}
      </Badge>
    )
  }

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const aptDate = parseISO(`${appointment.appointment_date}T${appointment.start_time}`)
    const canCancel = isFuture(aptDate) && appointment.status !== 'cancelled'
    
    // Check if this is a consultation appointment with an active room
    const hasConsultation = appointment.service?.is_consultation && 
      appointment.consultation && 
      appointment.consultation.length > 0 &&
      appointment.consultation[0].daily_room_url &&
      (appointment.consultation[0].consultation_status === 'scheduled' || 
       appointment.consultation[0].consultation_status === 'in_progress')

    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">{appointment.service?.name}</CardTitle>
              <CardDescription>
                {format(parseISO(appointment.appointment_date), 'EEEE, MMMM d, yyyy')}
              </CardDescription>
            </div>
            {getStatusBadge(appointment)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}</span>
            </div>
            {!appointment.service?.is_consultation && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>5200 Warner Ave #101, Huntington Beach, CA 92649</span>
              </div>
            )}
            {appointment.service?.is_consultation ? (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-green-600 font-medium">Free Consultation</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>${(appointment.total_price_cents / 100).toFixed(2)}</span>
              </div>
            )}
          </div>
          
          {/* Show Join Consultation button if available */}
          {hasConsultation && (
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => window.open(`/consultation/${appointment.consultation[0].id}`, '_blank')}
            >
              <Video className="h-4 w-4 mr-2" />
              Join Consultation Room
            </Button>
          )}
          
          {canCancel && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleReschedule(appointment)}
              >
                Reschedule
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => handleCancelClick(appointment)}
                disabled={cancellingId === appointment.id}
              >
                {cancellingId === appointment.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Cancel'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <PageContainer>
      <PageHeader 
        title="My Appointments"
        description="Manage your upcoming and past appointments"
      />

      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 mb-4">No upcoming appointments</p>
                <Button onClick={() => window.location.href = '/booking'}>
                  Book an Appointment
                </Button>
              </CardContent>
            </Card>
          ) : (
            upcomingAppointments.map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">No past appointments</p>
              </CardContent>
            </Card>
          ) : (
            pastAppointments.map(appointment => (
              <AppointmentCard key={appointment.id} appointment={appointment} />
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="py-4">
              <p className="font-medium">{selectedAppointment.service?.name}</p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(selectedAppointment.appointment_date), 'EEEE, MMMM d, yyyy')} at{' '}
                {selectedAppointment.start_time.substring(0, 5)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Appointment
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelConfirm}
              disabled={cancellingId !== null}
            >
              {cancellingId !== null ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Appointment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}