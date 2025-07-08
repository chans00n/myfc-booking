'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, DollarSign, CheckCircle, MessageSquare } from 'lucide-react'
import { AdminSiteHeader } from "@/components/admin-site-header"
import { ChartRevenue } from "@/components/chart-revenue"
import { ChartBookingPatterns } from "@/components/chart-booking-patterns"
import { DashboardRightSidebar } from "@/components/dashboard-right-sidebar"
import { createClient } from '@/lib/supabase/client'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks, formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  todayAppointments: {
    total: number
    confirmed: number
    scheduled: number
  }
  weeklyRevenue: {
    current: number
    previous: number
    percentChange: number
  }
  activeClients: {
    total: number
    newThisMonth: number
  }
  completionRate: number
  consultations: {
    todayTotal: number
    weekTotal: number
    completionRate: number
  }
}

interface Activity {
  id: string
  type: 'appointment' | 'payment' | 'completed'
  description: string
  details: string
  timestamp: Date
}

interface UpcomingAppointment {
  id: string
  clientName: string
  serviceName: string
  duration: number
  startTime: string
  date: string
  status: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: { total: 0, confirmed: 0, scheduled: 0 },
    weeklyRevenue: { current: 0, previous: 0, percentChange: 0 },
    activeClients: { total: 0, newThisMonth: 0 },
    completionRate: 0,
    consultations: { todayTotal: 0, weekTotal: 0, completionRate: 0 }
  })
  const [activities, setActivities] = useState<Activity[]>([])
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const now = new Date()
      const todayStart = startOfDay(now)
      const todayEnd = endOfDay(now)
      const weekStart = startOfWeek(now)
      const weekEnd = endOfWeek(now)
      const prevWeekStart = startOfWeek(subWeeks(now, 1))
      const prevWeekEnd = endOfWeek(subWeeks(now, 1))
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Fetch today's appointments
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('status')
        .eq('appointment_date', format(now, 'yyyy-MM-dd'))

      const todayStats = {
        total: todayAppointments?.length || 0,
        confirmed: todayAppointments?.filter(a => a.status === 'confirmed').length || 0,
        scheduled: todayAppointments?.filter(a => a.status === 'scheduled').length || 0
      }

      // Fetch weekly revenue
      const { data: currentWeekPayments } = await supabase
        .from('payments')
        .select('amount_cents')
        .eq('status', 'succeeded')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())

      const { data: prevWeekPayments } = await supabase
        .from('payments')
        .select('amount_cents')
        .eq('status', 'succeeded')
        .gte('created_at', prevWeekStart.toISOString())
        .lte('created_at', prevWeekEnd.toISOString())

      const currentRevenue = currentWeekPayments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0
      const previousRevenue = prevWeekPayments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0
      const percentChange = previousRevenue > 0 
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0

      // Fetch active clients
      const { data: totalClients } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'client')

      const { data: newClients } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'client')
        .gte('created_at', monthStart.toISOString())

      // Fetch completion rate (last 30 days)
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30))
      const { data: recentAppointments } = await supabase
        .from('appointments')
        .select('status')
        .gte('appointment_date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .in('status', ['completed', 'cancelled', 'no_show'])

      const completedCount = recentAppointments?.filter(a => a.status === 'completed').length || 0
      const totalCount = recentAppointments?.length || 0
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

      // Fetch consultation stats
      const { data: todayConsultations } = await supabase
        .from('consultations')
        .select('consultation_status')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString())

      const { data: weekConsultations } = await supabase
        .from('consultations')
        .select('consultation_status')
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())

      const consultationStats = {
        todayTotal: todayConsultations?.length || 0,
        weekTotal: weekConsultations?.length || 0,
        completionRate: weekConsultations?.length > 0 
          ? (weekConsultations.filter(c => c.consultation_status === 'completed').length / weekConsultations.length) * 100 
          : 0
      }

      // Fetch recent activities - include email for fallback
      const { data: recentActivities } = await supabase
        .from('appointments')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10)
        
      // Fetch related data separately
      const activityIds = recentActivities?.map(a => a.id) || []
      const clientIds = recentActivities?.map(a => a.client_id) || []
      const serviceIds = recentActivities?.map(a => a.service_id) || []
      
      const [{ data: clients }, { data: services }, { data: payments }] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, email').in('id', clientIds),
        supabase.from('services').select('id, name').in('id', serviceIds),
        supabase.from('payments').select('appointment_id, status, created_at, amount_cents').in('appointment_id', activityIds)
      ])
      
      // Map the data together
      const enrichedActivities = recentActivities?.map(appointment => ({
        ...appointment,
        client: clients?.find(c => c.id === appointment.client_id),
        service: services?.find(s => s.id === appointment.service_id),
        payments: payments?.filter(p => p.appointment_id === appointment.id) || []
      }))

      console.log('Recent activities:', enrichedActivities)
      
      const formattedActivities: Activity[] = []
      enrichedActivities?.forEach(appointment => {
        // Check if we have required data
        const clientName = appointment.client?.first_name && appointment.client?.last_name 
          ? `${appointment.client.first_name} ${appointment.client.last_name}`
          : appointment.client?.email || 'Unknown Client'
        const serviceName = appointment.service?.name || 'Unknown Service'

        // Add appointment activity for any status
        const appointmentDate = appointment.appointment_date 
          ? format(new Date(appointment.appointment_date), 'MMM d') 
          : ''
        const appointmentTime = appointment.start_time 
          ? format(new Date(`2000-01-01T${appointment.start_time}`), 'h:mm a')
          : ''
          
        formattedActivities.push({
          id: `apt-${appointment.id}`,
          type: 'appointment',
          description: appointment.status === 'completed' ? 'Appointment completed' :
                       appointment.status === 'cancelled' ? 'Appointment cancelled' :
                       appointment.status === 'no_show' ? 'Client no-show' :
                       appointment.status === 'confirmed' ? 'Appointment confirmed' :
                       appointment.status === 'scheduled' ? 'New appointment scheduled' :
                       'Appointment updated',
          details: `${clientName} - ${serviceName}${appointmentDate ? ` on ${appointmentDate}` : ''}${appointmentTime ? ` at ${appointmentTime}` : ''}`,
          timestamp: new Date(appointment.updated_at || appointment.created_at)
        })

        // Add payment activities
        appointment.payments?.forEach((payment: any) => {
          if (payment.status === 'succeeded') {
            formattedActivities.push({
              id: `pay-${appointment.id}-${payment.created_at}`,
              type: 'payment',
              description: 'Payment received',
              details: `${clientName} - $${(payment.amount_cents / 100).toFixed(2)}`,
              timestamp: new Date(payment.created_at)
            })
          }
        })
      })

      // Sort activities by timestamp and take top 5
      formattedActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      setActivities(formattedActivities.slice(0, 5))

      // Fetch upcoming appointments (next 24 hours)
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data: upcoming } = await supabase
        .from('appointments')
        .select('*')
        .gte('appointment_date', format(now, 'yyyy-MM-dd'))
        .lte('appointment_date', format(tomorrow, 'yyyy-MM-dd'))
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5) // Increased limit for sidebar
        
      // Get related data
      const upcomingClientIds = upcoming?.map(a => a.client_id) || []
      const upcomingServiceIds = upcoming?.map(a => a.service_id) || []
      
      const [{ data: upcomingClients }, { data: upcomingServices }] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name').in('id', upcomingClientIds),
        supabase.from('services').select('id, name, duration_minutes').in('id', upcomingServiceIds)
      ])

      const formattedUpcoming: UpcomingAppointment[] = upcoming?.map(apt => {
        const client = upcomingClients?.find(c => c.id === apt.client_id)
        const service = upcomingServices?.find(s => s.id === apt.service_id)
        return {
          id: apt.id,
          clientName: client ? `${client.first_name} ${client.last_name}` : 'Unknown Client',
          serviceName: service?.name || 'Unknown Service',
          duration: service?.duration_minutes || 60,
          startTime: apt.start_time,
          date: apt.appointment_date,
          status: apt.status
        }
      }) || []

      setUpcomingAppointments(formattedUpcoming)

      setStats({
        todayAppointments: todayStats,
        weeklyRevenue: {
          current: currentRevenue,
          previous: previousRevenue,
          percentChange
        },
        activeClients: {
          total: totalClients?.length || 0,
          newThisMonth: newClients?.length || 0
        },
        completionRate,
        consultations: consultationStats
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':')
    const date = new Date()
    date.setHours(parseInt(hour), parseInt(minute))
    return format(date, 'h:mm a')
  }

  const formatRevenue = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100)
  }

  const statsData = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments.total.toString(),
      icon: Calendar,
      description: `${stats.todayAppointments.confirmed} confirmed, ${stats.todayAppointments.scheduled} scheduled`,
      color: "text-blue-600"
    },
    {
      title: "Weekly Revenue",
      value: formatRevenue(stats.weeklyRevenue.current),
      icon: DollarSign,
      description: stats.weeklyRevenue.percentChange > 0 
        ? `+${stats.weeklyRevenue.percentChange.toFixed(0)}% from last week`
        : `${stats.weeklyRevenue.percentChange.toFixed(0)}% from last week`,
      color: "text-green-600"
    },
    {
      title: "Consultations",
      value: stats.consultations.weekTotal.toString(),
      icon: MessageSquare,
      description: `${stats.consultations.todayTotal} today, ${stats.consultations.completionRate.toFixed(0)}% completed`,
      color: "text-indigo-600"
    }
  ]

  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-1 xl:grid-cols-[1fr,320px] gap-6">
              {/* Main Content */}
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loading ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                        <CardHeader className="space-y-0 pb-2">
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </CardHeader>
                        <CardContent>
                          <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
                          <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    statsData.map((stat, index) => {
                      const Icon = stat.icon
                      return (
                        <Card key={index}>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                              {stat.title}
                            </CardTitle>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {stat.description}
                            </p>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </div>

                {/* Charts - Stacked Vertically */}
                <div className="space-y-6">
                  {/* Revenue Chart */}
                  <ChartRevenue />
                  
                  {/* Booking Patterns Chart */}
                  <ChartBookingPatterns />
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
                        <CardDescription>
                          Latest updates from your practice
                          {activities.length > 0 && ` (${activities.length} activities)`}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const res = await fetch('/api/admin/test-appointments', { method: 'POST' })
                          if (res.ok) {
                            fetchDashboardData()
                          }
                        }}
                      >
                        Create Test Data
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="py-2 border-b last:border-0">
                            <div className="h-4 w-32 bg-muted animate-pulse rounded mb-1" />
                            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                          </div>
                        ))}
                      </div>
                    ) : activities.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground mb-4">
                          No recent activity
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Activities will appear here when appointments are created, updated, or completed.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activities.map((activity, index) => (
                          <div key={activity.id} className={`flex items-center justify-between py-2 ${index < activities.length - 1 ? 'border-b' : ''}`}>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{activity.description}</p>
                                {activity.type === 'appointment' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Appointment
                                  </Badge>
                                )}
                                {activity.type === 'payment' && (
                                  <Badge variant="outline" className="text-xs">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    Paid
                                  </Badge>
                                )}
                                {activity.type === 'completed' && (
                                  <Badge variant="secondary" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Done
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">{activity.details}</p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Sidebar - Only show on larger screens */}
              <div className="hidden xl:block">
                <DashboardRightSidebar 
                  upcomingAppointments={upcomingAppointments}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}