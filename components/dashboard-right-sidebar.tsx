'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, X } from 'lucide-react'
import { format, isToday, isTomorrow } from 'date-fns'
import { DashboardCalendar } from '@/components/dashboard-calendar'
import { createClient } from '@/lib/supabase/client'

interface UpcomingAppointment {
  id: string
  clientName: string
  serviceName: string
  duration: number
  startTime: string
  date: string
  status: string
}

interface DashboardRightSidebarProps {
  upcomingAppointments: UpcomingAppointment[]
  loading: boolean
}

export function DashboardRightSidebar({ upcomingAppointments: defaultAppointments, loading: defaultLoading }: DashboardRightSidebarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [dateAppointments, setDateAppointments] = useState<UpcomingAppointment[]>([])
  const [loadingDateAppointments, setLoadingDateAppointments] = useState(false)
  
  const supabase = createClient()

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hour), parseInt(minute))
    return format(date, 'h:mm a')
  }

  useEffect(() => {
    if (selectedDate) {
      fetchAppointmentsForDate(selectedDate)
    } else {
      setDateAppointments([])
    }
  }, [selectedDate])

  const fetchAppointmentsForDate = async (date: Date) => {
    setLoadingDateAppointments(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          status,
          client:profiles!appointments_client_id_fkey(first_name, last_name),
          service:services!appointments_service_id_fkey(name, duration_minutes)
        `)
        .eq('appointment_date', dateStr)
        .in('status', ['scheduled', 'confirmed'])
        .order('start_time', { ascending: true })

      if (error) {
        console.error('Error fetching appointments:', error)
        return
      }

      const formatted: UpcomingAppointment[] = appointments?.map(apt => ({
        id: apt.id,
        clientName: `${apt.client.first_name} ${apt.client.last_name}`,
        serviceName: apt.service.name,
        duration: apt.service.duration_minutes,
        startTime: apt.start_time,
        date: apt.appointment_date,
        status: apt.status
      })) || []

      setDateAppointments(formatted)
    } catch (error) {
      console.error('Error fetching appointments for date:', error)
    } finally {
      setLoadingDateAppointments(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
  }

  const clearSelectedDate = () => {
    setSelectedDate(undefined)
  }

  // Determine which appointments to show
  const displayAppointments = selectedDate ? dateAppointments : defaultAppointments
  const isLoading = selectedDate ? loadingDateAppointments : defaultLoading
  const title = selectedDate 
    ? `Appointments for ${format(selectedDate, 'MMM d, yyyy')}`
    : 'Upcoming Appointments'
  const description = selectedDate
    ? isToday(selectedDate) ? 'Today' : isTomorrow(selectedDate) ? 'Tomorrow' : format(selectedDate, 'EEEE')
    : 'Next 24 hours'

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <DashboardCalendar 
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {title}
              </CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
            {selectedDate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={clearSelectedDate}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="py-2 border-b last:border-0">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mb-1" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : displayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No appointments {selectedDate ? 'on this date' : 'scheduled'}
            </p>
          ) : (
            <div className="space-y-3">
              {displayAppointments.map((appointment, index) => (
                <div key={appointment.id} className={`py-2 ${index < displayAppointments.length - 1 ? 'border-b' : ''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{appointment.clientName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {appointment.serviceName}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {appointment.duration} min
                        </Badge>
                        {appointment.status === 'confirmed' && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Confirmed
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-medium">{formatTime(appointment.startTime)}</span>
                      {!selectedDate && appointment.date !== format(new Date(), 'yyyy-MM-dd') && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appointment.date), 'MMM d')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}