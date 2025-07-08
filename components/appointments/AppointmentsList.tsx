'use client'

import { format } from 'date-fns'
import { Eye, Clock, User, DollarSign, Calendar, Video } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AppointmentStatus } from '@/types'

interface AppointmentWithRelations {
  id: string
  client_id: string
  service_id: string
  appointment_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  payment_status: 'pending' | 'paid' | 'refunded' | 'will_pay_later'
  notes: string | null
  total_price_cents: number
  client: {
    id: string
    first_name: string
    last_name: string
    email: string
    phone: string | null
  }
  service: {
    id: string
    name: string
    duration_minutes: number
    price_cents: number
    is_consultation?: boolean
  }
  consultation?: Array<{
    id: string
    consultation_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    daily_room_url: string | null
  }>
}

interface AppointmentsListProps {
  appointments: AppointmentWithRelations[]
  onViewDetails: (appointment: AppointmentWithRelations) => void
  statusColors: Record<AppointmentStatus, string>
  statusLabels: Record<AppointmentStatus, string>
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export function AppointmentsList({
  appointments,
  onViewDetails,
  statusColors,
  statusLabels
}: AppointmentsListProps) {
  return (
    <>
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {appointment.client.first_name} {appointment.client.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {appointment.client.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{appointment.service.name}</TableCell>
                <TableCell>{appointment.service.duration_minutes} min</TableCell>
                <TableCell>
                  <Badge variant={statusColors[appointment.status]}>
                    {statusLabels[appointment.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={appointment.payment_status === 'paid' ? 'outline' : 'secondary'}>
                    {appointment.payment_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Show Join Consultation button if available */}
                    {appointment.service?.is_consultation && 
                     appointment.consultation && 
                     appointment.consultation.length > 0 &&
                     appointment.consultation[0].daily_room_url &&
                     (appointment.consultation[0].consultation_status === 'scheduled' || 
                      appointment.consultation[0].consultation_status === 'in_progress') && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(`/consultation/${appointment.consultation![0].id}`, '_blank')}
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(appointment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div className="md:hidden space-y-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="p-4">
            <div className="space-y-3">
              {/* Header with date and status */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">
                    {format(new Date(appointment.appointment_date), 'MMM d, yyyy')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </div>
                </div>
                <Badge variant={statusColors[appointment.status]} className="ml-2">
                  {statusLabels[appointment.status]}
                </Badge>
              </div>

              {/* Client info */}
              <div className="flex items-start space-x-2">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">
                    {appointment.client.first_name} {appointment.client.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground break-all">
                    {appointment.client.email}
                  </div>
                  {appointment.client.phone && (
                    <div className="text-sm text-muted-foreground">
                      {appointment.client.phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Service info */}
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{appointment.service.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {appointment.service.duration_minutes} minutes
                  </div>
                </div>
              </div>

              {/* Join Consultation button if available */}
              {appointment.service?.is_consultation && 
               appointment.consultation && 
               appointment.consultation.length > 0 &&
               appointment.consultation[0].daily_room_url &&
               (appointment.consultation[0].consultation_status === 'scheduled' || 
                appointment.consultation[0].consultation_status === 'in_progress') && (
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => window.open(`/consultation/${appointment.consultation![0].id}`, '_blank')}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Consultation Room
                </Button>
              )}

              {/* Payment and actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={appointment.payment_status === 'paid' ? 'outline' : 'secondary'}>
                    {appointment.payment_status}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(appointment)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}