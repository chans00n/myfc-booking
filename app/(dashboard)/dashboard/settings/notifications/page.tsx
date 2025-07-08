'use client'

import { useState, useEffect } from 'react'
import { AdminSiteHeader } from '@/components/admin-site-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Bell, Mail, MessageSquare, Clock, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NotificationPreferences {
  email_enabled: boolean
  sms_enabled: boolean
  booking_confirmation: boolean
  appointment_reminder_24h: boolean
  appointment_reminder_2h: boolean
  cancellation_notification: boolean
  rescheduling_notification: boolean
  intake_form_reminder: boolean
  follow_up_emails: boolean
  marketing_emails: boolean
  reminder_time_24h: string
  reminder_time_2h: string | null
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    sms_enabled: false,
    booking_confirmation: true,
    appointment_reminder_24h: true,
    appointment_reminder_2h: true,
    cancellation_notification: true,
    rescheduling_notification: true,
    intake_form_reminder: true,
    follow_up_emails: true,
    marketing_emails: false,
    reminder_time_24h: '09:00',
    reminder_time_2h: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchUserAndPreferences()
  }, [])

  const fetchUserAndPreferences = async () => {
    setLoading(true)
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please log in to manage notification preferences')
        router.push('/auth/signin')
        return
      }

      setUserId(user.id)

      // Fetch existing preferences
      const { data: existingPrefs, error: prefsError } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (prefsError && prefsError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw prefsError
      }

      if (existingPrefs) {
        setPreferences({
          ...preferences,
          ...existingPrefs,
          reminder_time_24h: existingPrefs.reminder_time_24h?.slice(0, 5) || '09:00', // Format HH:MM
        })
      }
    } catch (error) {
      console.error('Error fetching preferences:', error)
      toast.error('Failed to load notification preferences')
    } finally {
      setLoading(false)
    }
  }

  const savePreferences = async () => {
    if (!userId) {
      toast.error('Please log in to save preferences')
      return
    }

    setSaving(true)
    try {
      const prefsToSave = {
        ...preferences,
        user_id: userId,
        reminder_time_24h: `${preferences.reminder_time_24h}:00`, // Convert to HH:MM:SS
      }

      // Try to update first, then insert if doesn't exist
      const { error: updateError } = await supabase
        .from('notification_preferences')
        .update(prefsToSave)
        .eq('user_id', userId)

      if (updateError) {
        // If update failed, try to insert
        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert([prefsToSave])

        if (insertError && insertError.code !== '23505') { // 23505 = unique violation
          throw insertError
        }
      }

      toast.success('Notification preferences saved successfully')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save notification preferences')
    } finally {
      setSaving(false)
    }
  }

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <>
      <AdminSiteHeader />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Notification Settings</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Manage how and when you receive notifications
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6 max-w-2xl">
                  {/* Communication Channels */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Communication Channels
                      </CardTitle>
                      <CardDescription>
                        Choose how you want to receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-enabled" className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          id="email-enabled"
                          checked={preferences.email_enabled}
                          onCheckedChange={() => togglePreference('email_enabled')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="sms-enabled" className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            SMS Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive text message notifications (additional charges may apply)
                          </p>
                        </div>
                        <Switch
                          id="sms-enabled"
                          checked={preferences.sms_enabled}
                          onCheckedChange={() => togglePreference('sms_enabled')}
                          disabled
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Appointment Notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Appointment Notifications</CardTitle>
                      <CardDescription>
                        Configure which appointment-related notifications you receive
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="booking-confirmation">
                          Booking Confirmations
                        </Label>
                        <Switch
                          id="booking-confirmation"
                          checked={preferences.booking_confirmation}
                          onCheckedChange={() => togglePreference('booking_confirmation')}
                          disabled={!preferences.email_enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="reminder-24h">
                          24-Hour Reminders
                        </Label>
                        <Switch
                          id="reminder-24h"
                          checked={preferences.appointment_reminder_24h}
                          onCheckedChange={() => togglePreference('appointment_reminder_24h')}
                          disabled={!preferences.email_enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="reminder-2h">
                          2-Hour Reminders
                        </Label>
                        <Switch
                          id="reminder-2h"
                          checked={preferences.appointment_reminder_2h}
                          onCheckedChange={() => togglePreference('appointment_reminder_2h')}
                          disabled={!preferences.email_enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="cancellation">
                          Cancellation Confirmations
                        </Label>
                        <Switch
                          id="cancellation"
                          checked={preferences.cancellation_notification}
                          onCheckedChange={() => togglePreference('cancellation_notification')}
                          disabled={!preferences.email_enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="rescheduling">
                          Rescheduling Notifications
                        </Label>
                        <Switch
                          id="rescheduling"
                          checked={preferences.rescheduling_notification}
                          onCheckedChange={() => togglePreference('rescheduling_notification')}
                          disabled={!preferences.email_enabled}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Reminder Timing */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Reminder Timing
                      </CardTitle>
                      <CardDescription>
                        Set when you want to receive reminder notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reminder-time">
                          24-Hour Reminder Time
                        </Label>
                        <Input
                          id="reminder-time"
                          type="time"
                          value={preferences.reminder_time_24h}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            reminder_time_24h: e.target.value
                          }))}
                          disabled={!preferences.appointment_reminder_24h}
                        />
                        <p className="text-sm text-muted-foreground">
                          Time of day to receive 24-hour reminders
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Other Notifications */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Other Notifications</CardTitle>
                      <CardDescription>
                        Additional notification preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="intake-reminder">
                          Intake Form Reminders
                        </Label>
                        <Switch
                          id="intake-reminder"
                          checked={preferences.intake_form_reminder}
                          onCheckedChange={() => togglePreference('intake_form_reminder')}
                          disabled={!preferences.email_enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="follow-up">
                          Follow-up Emails
                        </Label>
                        <Switch
                          id="follow-up"
                          checked={preferences.follow_up_emails}
                          onCheckedChange={() => togglePreference('follow_up_emails')}
                          disabled={!preferences.email_enabled}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="marketing">
                          Marketing & Promotions
                        </Label>
                        <Switch
                          id="marketing"
                          checked={preferences.marketing_emails}
                          onCheckedChange={() => togglePreference('marketing_emails')}
                          disabled={!preferences.email_enabled}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <Button 
                    onClick={savePreferences} 
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}