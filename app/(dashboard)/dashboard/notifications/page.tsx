'use client'

import { useState, useEffect } from 'react'
import { AdminSiteHeader } from '@/components/admin-site-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { Bell, Mail, MessageSquare, CheckCircle, XCircle, Clock, RefreshCw, Send, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useNotifications } from '@/hooks/use-notifications'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Notification {
  id: string
  recipient_email: string
  type: string
  channel: string
  status: string
  scheduled_for: string
  sent_at: string | null
  appointment_id: string
  subject: string
  error_message: string | null
  retry_count: number
  created_at: string
}

const statusColors: Record<string, string> = {
  pending: 'secondary',
  queued: 'default',
  sent: 'outline',
  failed: 'destructive',
  cancelled: 'secondary',
}

const typeLabels: Record<string, string> = {
  booking_confirmation: 'Booking Confirmation',
  appointment_reminder_24h: '24-Hour Reminder',
  appointment_reminder_2h: '2-Hour Reminder',
  cancellation_confirmation: 'Cancellation',
  rescheduling_notification: 'Rescheduling',
  intake_form_reminder: 'Intake Form Reminder',
  follow_up: 'Follow-up',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testType, setTestType] = useState<'booking' | 'reminder' | 'cancellation'>('booking')
  const [emailConfigured, setEmailConfigured] = useState(true)
  const [isDevelopment, setIsDevelopment] = useState(false)
  
  const { sendTestEmail, getNotificationHistory } = useNotifications()
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
    checkEmailConfiguration()
  }, [])

  const checkEmailConfiguration = async () => {
    try {
      const response = await fetch('/api/notifications/config')
      const data = await response.json()
      setEmailConfigured(data.emailServiceConfigured)
      setIsDevelopment(data.environment === 'development')
    } catch (error) {
      console.error('Error checking email configuration:', error)
    }
  }

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      console.log('Fetching notifications...')
      const data = await getNotificationHistory()
      console.log('Notifications fetched:', data)
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshNotifications = async () => {
    setRefreshing(true)
    await fetchNotifications()
    setRefreshing(false)
  }

  const processNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-secret'}`,
        },
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(`Processed ${result.processed} notifications`)
        await refreshNotifications()
      } else {
        toast.error('Failed to process notifications')
      }
    } catch (error) {
      console.error('Error processing notifications:', error)
      toast.error('Failed to process notifications')
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address')
      return
    }

    try {
      await sendTestEmail(testEmail, testType)
      setShowTestDialog(false)
      setTestEmail('')
      // Refresh notifications to show the new record
      setTimeout(() => {
        refreshNotifications()
      }, 1000) // Small delay to ensure database is updated
    } catch (error) {
      console.error('Error sending test email:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'pending':
      case 'queued':
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      default:
        return null
    }
  }

  // Calculate stats
  const stats = {
    total: notifications.length,
    sent: notifications.filter(n => n.status === 'sent').length,
    pending: notifications.filter(n => n.status === 'pending' || n.status === 'queued').length,
    failed: notifications.filter(n => n.status === 'failed').length,
  }

  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Monitor and manage all system notifications
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTestDialog(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Test Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshNotifications}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    onClick={processNotifications}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Process Queue
                  </Button>
                </div>
              </div>

              {/* Email Service Warning - Show based on server check */}
              {isDevelopment && !emailConfigured && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <CardTitle className="text-lg">Development Mode - Email Service Not Configured</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Email notifications are in development mode. Emails will be logged to the browser console instead of being sent.
                    </p>
                    <p className="text-sm">
                      To send real emails, add <code className="px-1 py-0.5 bg-orange-100 rounded">RESEND_API_KEY</code> to your <code className="px-1 py-0.5 bg-orange-100 rounded">.env.local</code> file and restart your server.
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {/* Email Service Success - Show when configured */}
              {emailConfigured && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <CardTitle className="text-lg">Email Service Active</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-green-700">
                      Email notifications are configured and ready to send. Test emails will be sent to real recipients.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sent</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.sent}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pending</CardTitle>
                    <Clock className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pending}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.failed}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Notifications Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification History</CardTitle>
                  <CardDescription>
                    View all sent and pending notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <Bell className="h-12 w-12 mb-4" />
                      <p>No notifications found</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Recipient</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Scheduled</TableHead>
                            <TableHead>Sent</TableHead>
                            <TableHead>Error</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {notifications.map((notification) => (
                            <TableRow key={notification.id}>
                              <TableCell>
                                <div className="font-medium">
                                  {typeLabels[notification.type] || notification.type}
                                </div>
                              </TableCell>
                              <TableCell>{notification.recipient_email}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {getChannelIcon(notification.channel)}
                                  <span className="capitalize">{notification.channel}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={statusColors[notification.status]} className="gap-1">
                                  {getStatusIcon(notification.status)}
                                  {notification.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {format(new Date(notification.scheduled_for), 'MMM d, h:mm a')}
                              </TableCell>
                              <TableCell>
                                {notification.sent_at
                                  ? format(new Date(notification.sent_at), 'MMM d, h:mm a')
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {notification.error_message ? (
                                  <span className="text-sm text-red-600">
                                    {notification.error_message}
                                  </span>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              {isDevelopment && !emailConfigured
                ? 'In development mode without email configuration, emails will be logged to the console.'
                : 'Send a test notification email to verify the system is working'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-type">Notification Type</Label>
              <Select value={testType} onValueChange={(value: any) => setTestType(value)}>
                <SelectTrigger id="test-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="booking">Booking Confirmation</SelectItem>
                  <SelectItem value="reminder">Appointment Reminder</SelectItem>
                  <SelectItem value="cancellation">Cancellation Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendTestEmail}>
              Send Test Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}